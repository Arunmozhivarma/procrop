import os
import sys
import sqlite3
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional

# Add root directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.schemas import JassidPredictionInput, PredictionResponse
from backend.weather_service import fetch_coimbatore_weather
from backend.vision_detector import analyze_cotton_leaf_image
from backend.auth import router as auth_router
from backend.database import (
    init_db,
    get_latest_previous_week_data,
    save_prediction_record,
    get_recent_predictions,
    get_latest_prediction,
    delete_prediction as delete_prediction_db,
    get_observations,
    get_dataset_summary as read_dataset_summary,
)
from src.preprocessing import MODEL_B_FEATURES
from src.shap_analysis import get_shap_explanation

app = FastAPI(
    title="Cotton Jassid Risk Prediction API",
    description="Backend API for predicting next-week Cotton Jassid risk in Coimbatore using live weather, leaf image pest detection, and historical lags from the SQLite database.",
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

app.include_router(auth_router)

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))

RISK_THRESHOLD = 1.95
NO_OBSERVATIONS_DETAIL = "No observations are stored in weekly_observations."

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
    try:
        init_db()
    except sqlite3.Error as e:
        # Keep serving: every database-backed endpoint reports the error as a 503.
        print(f"Database unavailable at startup: {e}")
    load_models()

@app.exception_handler(sqlite3.Error)
async def database_error_handler(request: Request, exc: sqlite3.Error):
    return JSONResponse(status_code=503, content={"detail": f"Database error: {exc}"})

def require_models():
    if regressor is None or classifier is None:
        load_models()
        if regressor is None or classifier is None:
            raise HTTPException(status_code=500, detail="Models not loaded. Train models first.")

def get_live_weather():
    try:
        return fetch_coimbatore_weather()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=f"Live weather is unavailable: {e}")

def required_value(row: dict, column: str, default: float = 0.0) -> float:
    """Reads a model input from a weekly_observations row; uses default if NULL."""
    value = row.get(column)
    if value is None:
        return default
    return float(value)

def run_model(row_dict: dict):
    """Runs XGBoost Model B on one feature row. Returns (prediction, risk label, top SHAP attributions)."""
    X_df = pd.DataFrame([row_dict])[MODEL_B_FEATURES].astype(float)

    pred_val = float(regressor.predict(X_df)[0])
    pred_val = max(0.0, round(pred_val, 2))

    risk_cls = int(classifier.predict(X_df)[0])
    risk_label = "HIGH" if (risk_cls == 1 or pred_val >= RISK_THRESHOLD) else "LOW"

    explanations = get_shap_explanation(regressor, X_df, feature_names=MODEL_B_FEATURES)
    return pred_val, risk_label, explanations[:5]

@app.get("/")
def read_root():
    return {
        "project": "Machine Learning-Based Prediction of Next-Week Cotton Jassid Risk",
        "crop": "Cotton",
        "region": "Coimbatore, Tamil Nadu",
        "features": [
            "Real-Time Weather Retrieval (Open-Meteo API)",
            "Leaf Image Pest Detection (Computer Vision)",
            "Time-Series Historical Lags from the SQLite Database",
            "Time-Series XGBoost Prediction",
            "SHAP Feature Attribution",
            "Persistent Predictions Database",
            "User Accounts (SQLite users table)"
        ],
        "status": "API is running"
    }

@app.get("/weather/coimbatore")
def get_coimbatore_weather():
    """Fetches real-time weather parameters for Coimbatore, Tamil Nadu from Open-Meteo API."""
    return get_live_weather()

@app.get("/dataset/previous-week")
def get_previous_week_historical():
    """
    Returns the latest previous week's observation from the database.
    Contains historical pest count lag values and weather lags.
    """
    data = get_latest_previous_week_data()
    if data is None:
        raise HTTPException(status_code=404, detail=NO_OBSERVATIONS_DETAIL)
    return data

@app.get("/predictions")
def list_predictions(limit: int = 15):
    """Retrieves recent predictions stored in the database table."""
    return get_recent_predictions(limit=max(1, min(limit, 500)))

@app.get("/predictions/latest")
def read_latest_prediction():
    """Returns the most recently saved prediction from the database table."""
    record = get_latest_prediction()
    if record is None:
        raise HTTPException(status_code=404, detail="No predictions are stored in the predictions table.")
    return record

@app.delete("/predictions/{prediction_id}")
def delete_prediction_endpoint(prediction_id: int):
    """Deletes a prediction by ID from the database table."""
    deleted = delete_prediction_db(prediction_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Prediction with ID {prediction_id} not found.")
    return {"message": f"Prediction {prediction_id} deleted successfully"}

@app.post("/analyze-leaf-image")
async def analyze_leaf_image(file: UploadFile = File(...)):
    """Analyzes an uploaded leaf image to detect and count Jassids (per 3 leaves)."""
    contents = await file.read()
    return analyze_cotton_leaf_image(contents, filename=file.filename)

def run_unified_pipeline(
    image_bytes: Optional[bytes] = None,
    image_name: Optional[str] = None,
    override_jassid: Optional[float] = None,
    override_lag_1: Optional[float] = None,
    override_lag_2: Optional[float] = None,
    override_max_temp: Optional[float] = None,
    override_min_temp: Optional[float] = None,
    override_rainfall: Optional[float] = None,
    override_rh: Optional[float] = None,
):
    """
    Single unified prediction pipeline:
    1. Extracts Jassid count per 3 leaves from the uploaded leaf image OR uses the supplied count.
    2. Retrieves previous week historical data from the SQLite database (lags).
    3. Fetches real-time weather for Coimbatore from Open-Meteo API.
    4. Feeds full feature vector into trained XGBoost Model B.
    5. Computes dynamic SHAP feature attributions.
    6. Automatically records and saves prediction to the SQLite 'predictions' database table.
    """
    require_models()

    # 1. Vision Detection (Leaf photo) or supplied count
    vision_result = None
    if image_bytes is not None:
        vision_result = analyze_cotton_leaf_image(image_bytes, filename=image_name)
    elif override_jassid is not None:
        image_name = "Database_Observation"
    else:
        raise HTTPException(status_code=400, detail="Upload a leaf photo or provide a Jassid count from the database.")

    detected_jassid = float(override_jassid) if override_jassid is not None else float(vision_result["jassid_per_3_leaves"])

    # 2. Previous Week Data from the database
    prev_week = get_latest_previous_week_data()
    if prev_week is None:
        raise HTTPException(status_code=404, detail=NO_OBSERVATIONS_DETAIL)
    final_lag_1 = float(override_lag_1) if override_lag_1 is not None else required_value(prev_week, "jassid_per_3_leaves")
    final_lag_2 = float(override_lag_2) if override_lag_2 is not None else required_value(prev_week, "jassid_lag_1")

    # 3. Live Weather API from Open-Meteo
    weather = get_live_weather()
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
        # Historical previous week weather lags from the database
        'max_temp_c_lag_1': required_value(prev_week, "max_temp_c"),
        'min_temp_c_lag_1': required_value(prev_week, "min_temp_c"),
        'rh_morning_pct_lag_1': required_value(prev_week, "rh_morning_pct"),
        'rh_evening_pct_lag_1': required_value(prev_week, "rh_evening_pct"),
        'rainfall_mm_lag_1': required_value(prev_week, "rainfall_mm"),
        'rainy_days_lag_1': required_value(prev_week, "rainy_days"),
        'wind_speed_kmh_lag_1': required_value(prev_week, "wind_speed_kmh"),
        'sunshine_hours_lag_1': required_value(prev_week, "sunshine_hours"),
        'jassid_per_3_leaves': float(detected_jassid),
        'jassid_lag_1': float(final_lag_1),
        'jassid_lag_2': float(final_lag_2),
    }

    # 5. Predict Next-Week Risk with dynamic SHAP explanations
    pred_val, risk_label, explanations = run_model(row_dict)
    model_used = "XGBoost (Model B — Vision + Live Weather + Database Lags)"

    # 6. Record and Save into Database Predictions Table
    db_record = save_prediction_record({
        "image_name": image_name,
        "detected_jassid": detected_jassid,
        "prev_week_smw": prev_week.get("smw"),
        "prev_week_jassid_lag_1": final_lag_1,
        "prev_week_jassid_lag_2": final_lag_2,
        "weather_source": weather["source"],
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
        "risk_threshold": RISK_THRESHOLD,
        "model_used": model_used,
        "explanation": explanations
    })

    return {
        "vision_analysis": vision_result,
        "live_weather": weather,
        "previous_week_data": prev_week,
        "prediction": {
            "predicted_next_week_jassid": pred_val,
            "risk": risk_label,
            "risk_threshold": RISK_THRESHOLD,
            "model_used": model_used,
            "explanation": explanations,
            "threshold_disclaimer": "Experimental median rule: >= 1.95 Jassids/3 leaves (not official ICAR threshold)"
        },
        "db_record": {
            "id": db_record["id"],
            "created_at": db_record["created_at"],
            "status": "saved"
        }
    }

@app.post("/predict-unified")
async def predict_unified(
    file: Optional[UploadFile] = File(None),
    override_jassid: Optional[float] = Form(None),
    override_lag_1: Optional[float] = Form(None),
    override_lag_2: Optional[float] = Form(None),
    override_max_temp: Optional[float] = Form(None),
    override_min_temp: Optional[float] = Form(None),
    override_rainfall: Optional[float] = Form(None),
    override_rh: Optional[float] = Form(None),
):
    """
    Unified prediction from a leaf photo or a supplied Jassid count,
    combined with live weather and database lags. Saves to the predictions table.
    """
    image_bytes = None
    image_name = None
    if file is not None and file.filename:
        image_bytes = await file.read()
        image_name = file.filename

    return run_unified_pipeline(
        image_bytes=image_bytes,
        image_name=image_name,
        override_jassid=override_jassid,
        override_lag_1=override_lag_1,
        override_lag_2=override_lag_2,
        override_max_temp=override_max_temp,
        override_min_temp=override_min_temp,
        override_rainfall=override_rainfall,
        override_rh=override_rh,
    )

@app.post("/auto-predict")
async def auto_predict_from_image_and_live_weather(
    file: UploadFile = File(...),
    jassid_lag_1: Optional[float] = Form(None),
    jassid_lag_2: Optional[float] = Form(None),
):
    """
    Automated pipeline from photo and live weather, saving to database.
    Lags come from the database unless explicitly supplied.
    """
    image_bytes = await file.read()
    return run_unified_pipeline(
        image_bytes=image_bytes,
        image_name=file.filename or "leaf.jpg",
        override_lag_1=jassid_lag_1,
        override_lag_2=jassid_lag_2,
    )

@app.get("/dataset/summary")
def get_dataset_summary():
    """Returns summaries calculated from the SQLite observations table."""
    return read_dataset_summary()

@app.get("/dataset/observations")
def list_observations(limit: int = 5000):
    return get_observations(limit=max(1, min(limit, 10000)))

@app.post("/dataset/predict-latest", response_model=PredictionResponse)
def predict_latest_observation():
    """
    Reads the latest weekly observation from SQLite and runs XGBoost.
    Saves prediction to database predictions table.
    """
    require_models()

    latest_row = get_latest_previous_week_data()
    if latest_row is None:
        raise HTTPException(status_code=404, detail=NO_OBSERVATIONS_DETAIL)

    row_dict = {col: required_value(latest_row, col) for col in MODEL_B_FEATURES}

    try:
        pred_val, risk_label, explanations = run_model(row_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

    smw = latest_row.get("smw")
    model_used = f"XGBoost Model B (Latest Week SMW {int(smw)})" if smw is not None else "XGBoost Model B (Latest Week)"

    # Save to DB
    save_prediction_record({
        "image_name": "Database_Latest_Week",
        "detected_jassid": row_dict["jassid_per_3_leaves"],
        "prev_week_smw": smw,
        "prev_week_jassid_lag_1": row_dict["jassid_lag_1"],
        "prev_week_jassid_lag_2": row_dict["jassid_lag_2"],
        "weather_source": "SQLite weekly_observations",
        "max_temp_c": row_dict["max_temp_c"],
        "min_temp_c": row_dict["min_temp_c"],
        "rh_morning_pct": row_dict["rh_morning_pct"],
        "rh_evening_pct": row_dict["rh_evening_pct"],
        "rainfall_mm": row_dict["rainfall_mm"],
        "rainy_days": row_dict["rainy_days"],
        "wind_speed_kmh": row_dict["wind_speed_kmh"],
        "sunshine_hours": row_dict["sunshine_hours"],
        "predicted_next_week_jassid": pred_val,
        "risk": risk_label,
        "risk_threshold": RISK_THRESHOLD,
        "model_used": model_used,
        "explanation": explanations
    })

    return PredictionResponse(
        predicted_next_week_jassid=pred_val,
        risk=risk_label,
        risk_threshold=RISK_THRESHOLD,
        model_used=model_used,
        explanation=explanations
    )

@app.post("/predict", response_model=PredictionResponse)
def predict_jassid_risk(data: JassidPredictionInput):
    require_models()

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

    pred_val, risk_label, explanations = run_model(row_dict)

    # Save prediction to DB. Manual input is not tied to a stored week, so prev_week_smw stays NULL.
    save_prediction_record({
        "image_name": "Manual_Input",
        "detected_jassid": float(data.jassid_per_3_leaves),
        "prev_week_smw": None,
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
        "risk_threshold": RISK_THRESHOLD,
        "model_used": "XGBoost (Model B — Manual Parameters)",
        "explanation": explanations
    })

    return PredictionResponse(
        predicted_next_week_jassid=pred_val,
        risk=risk_label,
        risk_threshold=RISK_THRESHOLD,
        model_used="XGBoost (Model B — Weather + Pest History)",
        explanation=explanations
    )
