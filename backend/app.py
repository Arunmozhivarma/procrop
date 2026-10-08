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
from src.preprocessing import MODEL_B_FEATURES, load_dataset
from src.shap_analysis import get_shap_explanation

app = FastAPI(
    title="Cotton Jassid Risk Prediction API",
    description="Backend API for predicting next-week Cotton Jassid risk in Coimbatore using live weather and leaf image pest detection.",
    version="1.1.0"
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
            "Time-Series XGBoost Prediction",
            "SHAP Feature Attribution"
        ],
        "status": "API is running"
    }

@app.get("/weather/coimbatore")
def get_coimbatore_weather():
    """Fetches real-time weather parameters for Coimbatore, Tamil Nadu from Open-Meteo API."""
    return fetch_coimbatore_weather()

@app.post("/analyze-leaf-image")
async def analyze_leaf_image(file: UploadFile = File(...)):
    """Analyzes an uploaded leaf image to detect and count Jassids (per 3 leaves)."""
    contents = await file.read()
    return analyze_cotton_leaf_image(contents, filename=file.filename)

@app.post("/auto-predict")
async def auto_predict_from_image_and_live_weather(
    file: UploadFile = File(...),
    jassid_lag_1: float = Form(1.8),
    jassid_lag_2: float = Form(1.5),
):
    """
    End-to-end automated pipeline:
    1. Detects Jassid count per 3 leaves from uploaded leaf image.
    2. Fetches real-time weather for Coimbatore from Open-Meteo API.
    3. Runs XGBoost Model B next-week prediction and returns SHAP attributions.
    """
    global regressor, classifier
    if regressor is None or classifier is None:
        load_models()
        if regressor is None or classifier is None:
            raise HTTPException(status_code=500, detail="Models not loaded. Run train_regression.py first.")
            
    # 1. Vision Detection
    image_bytes = await file.read()
    vision_result = analyze_cotton_leaf_image(image_bytes, filename=file.filename)
    detected_jassid = vision_result["jassid_per_3_leaves"]
    
    # 2. Live Weather API
    weather = fetch_coimbatore_weather()
    
    # 3. Build Feature Vector
    row_dict = {
        'max_temp_c': weather["max_temp_c"],
        'min_temp_c': weather["min_temp_c"],
        'rh_morning_pct': weather["rh_morning_pct"],
        'rh_evening_pct': weather["rh_evening_pct"],
        'rainfall_mm': weather["rainfall_mm"],
        'rainy_days': weather["rainy_days"],
        'wind_speed_kmh': weather["wind_speed_kmh"],
        'sunshine_hours': weather["sunshine_hours"],
        'mean_temp_c': weather["mean_temp_c"],
        'mean_rh_pct': weather["mean_rh_pct"],
        'max_temp_c_lag_1': weather["max_temp_c"] - 0.5,
        'min_temp_c_lag_1': weather["min_temp_c"] - 0.3,
        'rh_morning_pct_lag_1': weather["rh_morning_pct"] - 2.0,
        'rh_evening_pct_lag_1': weather["rh_evening_pct"] - 2.0,
        'rainfall_mm_lag_1': max(0.0, weather["rainfall_mm"] - 5.0),
        'rainy_days_lag_1': max(0, weather["rainy_days"] - 1),
        'wind_speed_kmh_lag_1': weather["wind_speed_kmh"],
        'sunshine_hours_lag_1': weather["sunshine_hours"],
        'jassid_per_3_leaves': detected_jassid,
        'jassid_lag_1': jassid_lag_1,
        'jassid_lag_2': jassid_lag_2,
    }
    
    X_df = pd.DataFrame([row_dict])[MODEL_B_FEATURES]
    
    pred_val = float(regressor.predict(X_df)[0])
    pred_val = max(0.0, round(pred_val, 2))
    
    risk_cls = int(classifier.predict(X_df)[0])
    risk_label = "HIGH" if (risk_cls == 1 or pred_val >= 1.95) else "LOW"
    
    explanations = get_shap_explanation(regressor, X_df, feature_names=MODEL_B_FEATURES)
    
    return {
        "vision_analysis": vision_result,
        "live_weather": weather,
        "prediction": {
            "predicted_next_week_jassid": pred_val,
            "risk": risk_label,
            "risk_threshold": 1.95,
            "model_used": "XGBoost (Model B — Vision Pest Detection + Open-Meteo Live Weather)",
            "explanation": explanations[:5]
        }
    }

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
    """Reads the latest week's observation directly from local 02_Jassid_Model_Ready.xlsx and runs XGBoost."""
    global regressor, classifier
    if regressor is None or classifier is None:
        load_models()
        if regressor is None or classifier is None:
            raise HTTPException(status_code=500, detail="Models not loaded. Run train_regression.py first.")
    
    try:
        df = load_dataset(DATA_PATH)
        latest_row = df.iloc[-1]
        
        row_dict = {col: float(latest_row[col]) for col in MODEL_B_FEATURES if col in latest_row and pd.notnull(latest_row[col])}
        X_df = pd.DataFrame([row_dict])[MODEL_B_FEATURES]
        
        pred_val = float(regressor.predict(X_df)[0])
        pred_val = max(0.0, round(pred_val, 2))
        
        risk_cls = int(classifier.predict(X_df)[0])
        risk_label = "HIGH" if (risk_cls == 1 or pred_val >= 1.95) else "LOW"
        
        explanations = get_shap_explanation(regressor, X_df, feature_names=MODEL_B_FEATURES)
        
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
        'max_temp_c': data.max_temp_c,
        'min_temp_c': data.min_temp_c,
        'rh_morning_pct': data.rh_morning_pct,
        'rh_evening_pct': data.rh_evening_pct,
        'rainfall_mm': data.rainfall_mm,
        'rainy_days': data.rainy_days,
        'wind_speed_kmh': data.wind_speed_kmh,
        'sunshine_hours': data.sunshine_hours,
        'mean_temp_c': mean_temp_c,
        'mean_rh_pct': mean_rh_pct,
        'max_temp_c_lag_1': data.max_temp_c_lag_1,
        'min_temp_c_lag_1': data.min_temp_c_lag_1,
        'rh_morning_pct_lag_1': data.rh_morning_pct_lag_1,
        'rh_evening_pct_lag_1': data.rh_evening_pct_lag_1,
        'rainfall_mm_lag_1': data.rainfall_mm_lag_1,
        'rainy_days_lag_1': data.rainy_days_lag_1,
        'wind_speed_kmh_lag_1': data.wind_speed_kmh_lag_1,
        'sunshine_hours_lag_1': data.sunshine_hours_lag_1,
        'jassid_per_3_leaves': data.jassid_per_3_leaves,
        'jassid_lag_1': data.jassid_lag_1,
        'jassid_lag_2': data.jassid_lag_2,
    }
    
    X_df = pd.DataFrame([row_dict])[MODEL_B_FEATURES]
    
    pred_val = float(regressor.predict(X_df)[0])
    pred_val = max(0.0, round(pred_val, 2))
    
    risk_cls = int(classifier.predict(X_df)[0])
    risk_label = "HIGH" if (risk_cls == 1 or pred_val >= 1.95) else "LOW"
    
    explanations = get_shap_explanation(regressor, X_df, feature_names=MODEL_B_FEATURES)
    
    return PredictionResponse(
        predicted_next_week_jassid=pred_val,
        risk=risk_label,
        risk_threshold=1.95,
        model_used="XGBoost (Model B — Weather + Pest History)",
        explanation=explanations[:5]
    )
