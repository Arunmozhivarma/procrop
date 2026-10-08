import os
import sys
import joblib
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

# Add root directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.schemas import JassidPredictionInput, PredictionResponse
from backend.weather_service import fetch_coimbatore_weather
from backend.vision_detector import analyze_cotton_leaf_image
from backend.database import (
    init_db,
    get_latest_previous_week_data,
    save_prediction_record,
    get_recent_predictions,
)
from src.preprocessing import MODEL_B_FEATURES, load_dataset
from src.shap_analysis import get_shap_explanation

app = FastAPI(
    title="Cotton Jassid Risk Prediction API",
    description="Backend API for predicting next-week Cotton Jassid risk in Coimbatore using live weather, leaf image pest detection, and Excel/DB historical lags.",
    version="2.0.0"
)

# Enable CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "02_Jassid_Model_Ready.xlsx"))
PUBLIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "sample-leaves"))

regressor = None
classifier = None

def load_models():
    global regressor, classifier
    reg_path = os.path.join(MODELS_DIR, "xgb_regressor.pkl")
    cls_path = os.path.join(MODELS_DIR, "xgb_classifier.pkl")
    
    if os.path.exists(reg_path):
        regressor = joblib.load(reg_path)
    if os.path.exists(cls_path):
        classifier = joblib.load(cls_path)

@app.on_event("startup")
def startup_event():
    init_db()
    load_models()

@app.get("/")
def read_root():
    return {
        "project": "Machine Learning-Based Prediction of Next-Week Cotton Jassid Risk",
        "crop": "Cotton",
        "region": "Coimbatore, Tamil Nadu",
        "features": [
            "Real-Time Weather Retrieval (Open-Meteo API)",
            "Leaf Image Pest Detection (Computer Vision)",
            "Time-Series Historical Lags from Excel & SQLite DB",
            "Time-Series XGBoost Prediction",
            "SHAP Feature Attribution",
            "Persistent Predictions Database"
        ],
        "status": "API is running"
    }

@app.get("/weather/coimbatore")
def get_coimbatore_weather():
    """Fetches real-time weather parameters for Coimbatore, Tamil Nadu from Open-Meteo API."""
    return fetch_coimbatore_weather()

@app.get("/dataset/previous-week")
def get_previous_week_historical():
    """
    Returns the latest previous week's observation from Excel/DB.
    Contains historical pest count lag values and weather lags.
    """
    try:
        data = get_latest_previous_week_data()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch previous week data: {str(e)}")

@app.get("/predictions")
def list_predictions(limit: int = 15):
    """Retrieves recent predictions stored in the database table."""
    try:
        return get_recent_predictions(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch predictions history: {str(e)}")

@app.post("/analyze-leaf-image")
async def analyze_leaf_image(file: UploadFile = File(...)):
    """Analyzes an uploaded leaf image to detect and count Jassids (per 3 leaves)."""
    contents = await file.read()
    return analyze_cotton_leaf_image(contents, filename=file.filename)

@app.post("/predict-unified")
async def predict_unified(
    file: Optional[UploadFile] = File(None),
    sample_id: Optional[str] = Form(None),
    override_jassid: Optional[float] = Form(None),
    override_lag_1: Optional[float] = Form(None),
    override_lag_2: Optional[float] = Form(None),
    override_max_temp: Optional[float] = Form(None),
    override_min_temp: Optional[float] = Form(None),
    override_rainfall: Optional[float] = Form(None),
    override_rh: Optional[float] = Form(None),
):
    """
    Single unified prediction pipeline:
    1. Extracts Jassid count per 3 leaves from uploaded leaf image OR selected preset sample.
    2. Retrieves previous week historical data from Excel / SQLite DB (lags).
    3. Fetches real-time weather for Coimbatore from Open-Meteo API.
    4. Feeds full feature vector into trained XGBoost Model B.
    5. Computes dynamic SHAP feature attributions.
    6. Automatically records and saves prediction to the SQLite 'predictions' database table.
    """
    global regressor, classifier
    if regressor is None or classifier is None:
        load_models()
        if regressor is None or classifier is None:
            raise HTTPException(status_code=500, detail="Models not loaded. Train models first.")

    # 1. Vision Detection (Leaf photo or preset sample)
    vision_result = None
    image_name = "custom_leaf_photo.jpg"

    if file is not None and file.filename:
        image_bytes = await file.read()
        image_name = file.filename
        vision_result = analyze_cotton_leaf_image(image_bytes, filename=image_name)
    elif sample_id:
        sample_map = {
            "sample-heavy": "jassid_heavy_sample.jpg",
            "sample-moderate": "jassid_moderate_sample.jpg",
            "sample-mild": "jassid_mild_sample.jpg",
        }
        target_fn = sample_map.get(sample_id, "jassid_moderate_sample.jpg")
        image_name = target_fn
        sample_path = os.path.join(PUBLIC_DIR, target_fn)
        if os.path.exists(sample_path):
            with open(sample_path, "rb") as f:
                sample_bytes = f.read()
            vision_result = analyze_cotton_leaf_image(sample_bytes, filename=target_fn)
        else:
            vision_result = analyze_cotton_leaf_image(b"", filename=target_fn)
    else:
        # Default fallback to moderate sample
        sample_path = os.path.join(PUBLIC_DIR, "jassid_moderate_sample.jpg")
        if os.path.exists(sample_path):
            with open(sample_path, "rb") as f:
                sample_bytes = f.read()
            vision_result = analyze_cotton_leaf_image(sample_bytes, filename="jassid_moderate_sample.jpg")
        else:
            vision_result = analyze_cotton_leaf_image(b"", filename="jassid_moderate_sample.jpg")

    detected_jassid = float(override_jassid) if override_jassid is not None else float(vision_result["jassid_per_3_leaves"])

    # 2. Previous Week Data from Excel / DB
    prev_week = get_latest_previous_week_data()
    final_lag_1 = float(override_lag_1) if override_lag_1 is not None else float(prev_week["jassid_per_3_leaves"])
    final_lag_2 = float(override_lag_2) if override_lag_2 is not None else float(prev_week["jassid_lag_1"])

    # 3. Live Weather API from Open-Meteo
    weather = fetch_coimbatore_weather()
    max_temp = float(override_max_temp) if override_max_temp is not None else float(weather["max_temp_c"])
    min_temp = float(override_min_temp) if override_min_temp is not None else float(weather["min_temp_c"])
    rh_m = float(override_rh) if override_rh is not None else float(weather["rh_morning_pct"])
    rh_e = float(weather["rh_evening_pct"])
    rainfall = float(override_rainfall) if override_rainfall is not None else float(weather["rainfall_mm"])
    rainy_days = int(weather["rainy_days"])
    wind = float(weather["wind_speed_kmh"])
    sunshine = float(weather["sunshine_hours"])

    mean_temp = round((max_temp + min_temp) / 2.0, 1)
    mean_rh = round((rh_m + rh_e) / 2.0, 1)

    # Historical previous week weather lags from Excel / DB
    max_temp_lag1 = float(prev_week.get("max_temp_c", max_temp))
    min_temp_lag1 = float(prev_week.get("min_temp_c", min_temp))
    rh_m_lag1 = float(prev_week.get("rh_morning_pct", rh_m))
    rh_e_lag1 = float(prev_week.get("rh_evening_pct", rh_e))
    rainfall_lag1 = float(prev_week.get("rainfall_mm", rainfall))
    rainy_days_lag1 = float(prev_week.get("rainy_days", rainy_days))
    wind_lag1 = float(prev_week.get("wind_speed_kmh", wind))
    sunshine_lag1 = float(prev_week.get("sunshine_hours", sunshine))

    # 4. Construct Feature Vector in exact Model B order
    row_dict = {
        'max_temp_c': float(max_temp),
        'min_temp_c': float(min_temp),
        'rh_morning_pct': float(rh_m),
        'rh_evening_pct': float(rh_e),
        'rainfall_mm': float(rainfall),
        'rainy_days': float(rainy_days),
        'wind_speed_kmh': float(wind),
        'sunshine_hours': float(sunshine),
        'mean_temp_c': float(mean_temp),
        'mean_rh_pct': float(mean_rh),
        'max_temp_c_lag_1': float(max_temp_lag1),
        'min_temp_c_lag_1': float(min_temp_lag1),
        'rh_morning_pct_lag_1': float(rh_m_lag1),
        'rh_evening_pct_lag_1': float(rh_e_lag1),
        'rainfall_mm_lag_1': float(rainfall_lag1),
        'rainy_days_lag_1': float(rainy_days_lag1),
        'wind_speed_kmh_lag_1': float(wind_lag1),
        'sunshine_hours_lag_1': float(sunshine_lag1),
        'jassid_per_3_leaves': float(detected_jassid),
        'jassid_lag_1': float(final_lag_1),
        'jassid_lag_2': float(final_lag_2),
    }

    X_df = pd.DataFrame([row_dict])[MODEL_B_FEATURES].astype(float)

    # 5. Predict Next-Week Risk
    pred_val = float(regressor.predict(X_df)[0])
    pred_val = max(0.0, round(pred_val, 2))

    risk_cls = int(classifier.predict(X_df)[0])
    risk_label = "HIGH" if (risk_cls == 1 or pred_val >= 1.95) else "LOW"

    # 6. Dynamic SHAP Explanations
    explanations = get_shap_explanation(regressor, X_df, feature_names=MODEL_B_FEATURES)

    # 7. Record and Save into Database Predictions Table
    db_record = save_prediction_record({
        "image_name": image_name,
        "detected_jassid": detected_jassid,
        "prev_week_smw": prev_week.get("smw", 45),
        "prev_week_jassid_lag_1": final_lag_1,
        "prev_week_jassid_lag_2": final_lag_2,
        "weather_source": weather.get("source", "Open-Meteo API"),
        "max_temp_c": max_temp,
        "min_temp_c": min_temp,
        "rh_morning_pct": rh_m,
        "rh_evening_pct": rh_e,
        "rainfall_mm": rainfall,
        "rainy_days": rainy_days,
        "wind_speed_kmh": wind,
        "sunshine_hours": sunshine,
        "predicted_next_week_jassid": pred_val,
        "risk": risk_label,
        "risk_threshold": 1.95,
        "model_used": "XGBoost (Model B — Vision + Live Weather + Excel/DB Lags)",
        "explanation": explanations[:5]
    })

    return {
        "vision_analysis": vision_result,
        "live_weather": weather,
        "previous_week_data": prev_week,
        "prediction": {
            "predicted_next_week_jassid": pred_val,
            "risk": risk_label,
            "risk_threshold": 1.95,
            "model_used": "XGBoost (Model B — Vision + Live Weather + Excel/DB Lags)",
            "explanation": explanations[:5],
            "threshold_disclaimer": "Experimental median rule: >= 1.95 Jassids/3 leaves (not official ICAR threshold)"
        },
        "db_record": {
            "id": db_record["id"],
            "created_at": db_record["created_at"],
            "status": "saved"
        }
    }

@app.post("/auto-predict")
async def auto_predict_from_image_and_live_weather(
    file: UploadFile = File(...),
    jassid_lag_1: Optional[float] = Form(None),
    jassid_lag_2: Optional[float] = Form(None),
):
    """
    Automated pipeline from photo and live weather, saving to database.
    """
    return await predict_unified(
        file=file,
        override_lag_1=jassid_lag_1,
        override_lag_2=jassid_lag_2
    )

@app.get("/dataset/summary")
def get_dataset_summary():
    """Reads dataset directly from local 02_Jassid_Model_Ready.xlsx in project folder."""
    try:
        df = load_dataset(DATA_PATH)
        df_clean = df.replace({np.nan: None})
        return {
            "file_name": "02_Jassid_Model_Ready.xlsx",
            "total_rows": len(df),
            "columns_count": len(df.columns),
            "years_covered": [int(x) for x in df["report_year"].dropna().unique().tolist()] if "report_year" in df.columns else [],
            "smw_range": [int(df["smw"].min()), int(df["smw"].max())] if "smw" in df.columns else [],
            "sample_records": df_clean.tail(5).to_dict(orient="records")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read dataset: {str(e)}")

@app.get("/dataset/predict-latest", response_model=PredictionResponse)
def predict_latest_from_excel():
    """
    Reads the latest week's observation directly from local 02_Jassid_Model_Ready.xlsx and runs XGBoost.
    Gracefully fills missing values with dataset medians to avoid KeyError.
    Saves prediction to database predictions table.
    """
    global regressor, classifier
    if regressor is None or classifier is None:
        load_models()
        if regressor is None or classifier is None:
            raise HTTPException(status_code=500, detail="Models not loaded. Train models first.")
    
    try:
        df = load_dataset(DATA_PATH)
        medians = df[MODEL_B_FEATURES].median().to_dict()
        latest_row = df.iloc[-1]
        
        row_dict = {}
        for col in MODEL_B_FEATURES:
            if col in latest_row and pd.notnull(latest_row[col]):
                row_dict[col] = float(latest_row[col])
            else:
                row_dict[col] = float(medians.get(col, 0.0))
                
        X_df = pd.DataFrame([row_dict])[MODEL_B_FEATURES].astype(float)
        
        pred_val = float(regressor.predict(X_df)[0])
        pred_val = max(0.0, round(pred_val, 2))
        
        risk_cls = int(classifier.predict(X_df)[0])
        risk_label = "HIGH" if (risk_cls == 1 or pred_val >= 1.95) else "LOW"
        
        explanations = get_shap_explanation(regressor, X_df, feature_names=MODEL_B_FEATURES)

        # Save to DB
        save_prediction_record({
            "image_name": "Excel_Latest_Week",
            "detected_jassid": float(latest_row.get("jassid_per_3_leaves", 1.95)),
            "prev_week_smw": int(latest_row.get("smw", 0)),
            "prev_week_jassid_lag_1": float(latest_row.get("jassid_lag_1", 2.0)),
            "prev_week_jassid_lag_2": float(latest_row.get("jassid_lag_2", 2.0)) if pd.notnull(latest_row.get("jassid_lag_2")) else 2.0,
            "weather_source": "Excel Historical Dataset",
            "max_temp_c": float(row_dict.get("max_temp_c", 30.0)),
            "min_temp_c": float(row_dict.get("min_temp_c", 22.0)),
            "rh_morning_pct": float(row_dict.get("rh_morning_pct", 80.0)),
            "rh_evening_pct": float(row_dict.get("rh_evening_pct", 55.0)),
            "rainfall_mm": float(row_dict.get("rainfall_mm", 0.0)),
            "rainy_days": int(row_dict.get("rainy_days", 0)),
            "wind_speed_kmh": float(row_dict.get("wind_speed_kmh", 5.0)),
            "sunshine_hours": float(row_dict.get("sunshine_hours", 6.0)),
            "predicted_next_week_jassid": pred_val,
            "risk": risk_label,
            "risk_threshold": 1.95,
            "model_used": f"XGBoost Model B (Latest Week SMW {int(latest_row.get('smw', 0))})",
            "explanation": explanations[:5]
        })
        
        return PredictionResponse(
            predicted_next_week_jassid=pred_val,
            risk=risk_label,
            risk_threshold=1.95,
            model_used=f"XGBoost Model B (Latest Week SMW {int(latest_row.get('smw', 0))})",
            explanation=explanations[:5]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict", response_model=PredictionResponse)
def predict_jassid_risk(data: JassidPredictionInput):
    global regressor, classifier
    if regressor is None or classifier is None:
        load_models()
        if regressor is None or classifier is None:
            raise HTTPException(status_code=500, detail="Models not loaded. Train models first.")
    
    mean_temp_c = (data.max_temp_c + data.min_temp_c) / 2.0
    mean_rh_pct = (data.rh_morning_pct + data.rh_evening_pct) / 2.0
    
    row_dict = {
        'max_temp_c': float(data.max_temp_c),
        'min_temp_c': float(data.min_temp_c),
        'rh_morning_pct': float(data.rh_morning_pct),
        'rh_evening_pct': float(data.rh_evening_pct),
        'rainfall_mm': float(data.rainfall_mm),
        'rainy_days': float(data.rainy_days),
        'wind_speed_kmh': float(data.wind_speed_kmh),
        'sunshine_hours': float(data.sunshine_hours),
        'mean_temp_c': float(mean_temp_c),
        'mean_rh_pct': float(mean_rh_pct),
        'max_temp_c_lag_1': float(data.max_temp_c_lag_1),
        'min_temp_c_lag_1': float(data.min_temp_c_lag_1),
        'rh_morning_pct_lag_1': float(data.rh_morning_pct_lag_1),
        'rh_evening_pct_lag_1': float(data.rh_evening_pct_lag_1),
        'rainfall_mm_lag_1': float(data.rainfall_mm_lag_1),
        'rainy_days_lag_1': float(data.rainy_days_lag_1),
        'wind_speed_kmh_lag_1': float(data.wind_speed_kmh_lag_1),
        'sunshine_hours_lag_1': float(data.sunshine_hours_lag_1),
        'jassid_per_3_leaves': float(data.jassid_per_3_leaves),
        'jassid_lag_1': float(data.jassid_lag_1),
        'jassid_lag_2': float(data.jassid_lag_2),
    }
    
    X_df = pd.DataFrame([row_dict])[MODEL_B_FEATURES].astype(float)
    
    pred_val = float(regressor.predict(X_df)[0])
    pred_val = max(0.0, round(pred_val, 2))
    
    risk_cls = int(classifier.predict(X_df)[0])
    risk_label = "HIGH" if (risk_cls == 1 or pred_val >= 1.95) else "LOW"
    
    explanations = get_shap_explanation(regressor, X_df, feature_names=MODEL_B_FEATURES)

    # Save prediction to DB
    save_prediction_record({
        "image_name": "Manual_Input",
        "detected_jassid": float(data.jassid_per_3_leaves),
        "prev_week_smw": 45,
        "prev_week_jassid_lag_1": float(data.jassid_lag_1),
        "prev_week_jassid_lag_2": float(data.jassid_lag_2),
        "weather_source": "Manual Form Input",
        "max_temp_c": float(data.max_temp_c),
        "min_temp_c": float(data.min_temp_c),
        "rh_morning_pct": float(data.rh_morning_pct),
        "rh_evening_pct": float(data.rh_evening_pct),
        "rainfall_mm": float(data.rainfall_mm),
        "rainy_days": int(data.rainy_days),
        "wind_speed_kmh": float(data.wind_speed_kmh),
        "sunshine_hours": float(data.sunshine_hours),
        "predicted_next_week_jassid": pred_val,
        "risk": risk_label,
        "risk_threshold": 1.95,
        "model_used": "XGBoost (Model B — Manual Parameters)",
        "explanation": explanations[:5]
    })
    
    return PredictionResponse(
        predicted_next_week_jassid=pred_val,
        risk=risk_label,
        risk_threshold=1.95,
        model_used="XGBoost (Model B — Weather + Pest History)",
        explanation=explanations[:5]
    )
