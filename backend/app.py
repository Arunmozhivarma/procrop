import os
import sys
import io
import json
import time
import shutil
import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
from PIL import Image

# Ensure local writable cache for matplotlib and numba
_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault('MPLCONFIGDIR', os.path.join(_root, '.mplconfig'))
os.environ.setdefault('NUMBA_CACHE_DIR', os.path.join(_root, '.numbacache'))
os.makedirs(os.environ['MPLCONFIGDIR'], exist_ok=True)
os.makedirs(os.environ['NUMBA_CACHE_DIR'], exist_ok=True)

import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Add root directory to sys.path
sys.path.append(_root)

from backend.schemas import (
    UserRegisterInput, UserLoginInput, UserResponse, TokenResponse,
    FieldCreateInput, FieldResponse, PredictionSubmissionInput,
    JassidPredictionInput, PredictionResponse
)
from backend.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, revoke_token, increment_user_token_version, security
)
from backend.database import (
    init_db, get_connection, get_user_by_email, get_user_by_id,
    create_user, get_user_fields, get_field_by_id, create_user_field,
    save_prediction_submission, get_user_predictions, get_user_prediction_by_id,
    get_latest_field_prediction, get_latest_previous_week_data,
    save_prediction_record, get_recent_predictions
)
from backend.vision_detector import (
    analyze_cotton_leaf_image, aggregate_leaf_submissions
)
from backend.weather_service import fetch_coimbatore_weather
from backend.risk_engine import compute_risk
from backend.recommendation import get_recommendation
from backend.config import get_app_config
from src.preprocessing import MODEL_B_FEATURES, load_dataset
from src.shap_analysis import get_shap_explanation

app = FastAPI(
    title="ProCrop: Cotton Jassid Risk Prediction API",
    description="Full-stack AI engine predicting next-week Cotton Jassid risk and hopper burn from leaf photos, agronomy, and weather.",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS_DIR = os.path.join(_root, "backend", "models")
CONFIG_DIR = os.path.join(_root, "backend", "config")
DATA_PATH = os.path.join(_root, "02_Jassid_Model_Ready.xlsx")
FALLBACK_DATA_PATH = os.path.join(_root, "data", "02_Jassid_Model_Ready.xlsx")
PUBLIC_DIR = os.path.join(_root, "public", "sample-leaves")
UPLOADS_DIR = os.path.join(_root, "data", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/")
def read_root():
    return {
        "project": "ProCrop Cotton Jassid Risk Prediction System",
        "crop": "Cotton (Gossypium hirsutum)",
        "pest": "Amrasca biguttula biguttula (Cotton Leafhopper / Jassid)",
        "status": "operational",
        "version": "2.1.0"
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "procrop-api"}

@app.get("/api/config")
def get_config():
    """Returns application configuration as single source of truth."""
    return get_app_config()

# ==================== Phase 8: Model Info & File Map ====================

@app.get("/api/model-info")
def get_model_info():
    """
    Exposes measured evaluation metrics, dataset sources, licenses, and verified file map.
    Read directly from JSON files so the About & Methods page never goes stale.
    """
    detector_metrics_file = os.path.join(MODELS_DIR, "detector_metrics.json")
    hopper_metrics_file = os.path.join(MODELS_DIR, "hopper_burn_metrics.json")
    risk_metrics_file = os.path.join(MODELS_DIR, "risk_metrics.json")
    app_config_file = os.path.join(CONFIG_DIR, "app_config.json")
    modifiers_file = os.path.join(CONFIG_DIR, "risk_modifiers.json")
    recommendations_file = os.path.join(CONFIG_DIR, "recommendations.json")

    detector_metrics = {}
    if os.path.exists(detector_metrics_file):
        with open(detector_metrics_file, "r", encoding="utf-8") as f:
            detector_metrics = json.load(f)

    hopper_metrics = {}
    if os.path.exists(hopper_metrics_file):
        with open(hopper_metrics_file, "r", encoding="utf-8") as f:
            hopper_metrics = json.load(f)

    risk_metrics = {}
    if os.path.exists(risk_metrics_file):
        with open(risk_metrics_file, "r", encoding="utf-8") as f:
            risk_metrics = json.load(f)

    app_config = get_app_config()

    file_map = [
        {"path": "backend/app.py", "role": "FastAPI orchestration, endpoints, input validation, and multipart predict router", "exists": os.path.exists(os.path.join(_root, "backend", "app.py"))},
        {"path": "backend/auth.py", "role": "Bcrypt password hashing, JWT sessions, and server-side token revocation", "exists": os.path.exists(os.path.join(_root, "backend", "auth.py"))},
        {"path": "backend/database.py", "role": "SQLite database layer, idempotent migrations, per-user multi-tenant query isolation", "exists": os.path.exists(os.path.join(_root, "backend", "database.py"))},
        {"path": "backend/vision_detector.py", "role": "YOLOv8n object detector, blur/glare quality filters, and 95% bootstrap CI aggregator", "exists": os.path.exists(os.path.join(_root, "backend", "vision_detector.py"))},
        {"path": "backend/hopper_burn.py", "role": "ICCC/AICRP 0-4 scale hopper burn grader via margin HSV chlorosis/necrosis segmentation", "exists": os.path.exists(os.path.join(_root, "backend", "hopper_burn.py"))},
        {"path": "backend/risk_engine.py", "role": "LOSOCV ML model, transparent expert-rule modifiers, clamping, and SHAP attributions", "exists": os.path.exists(os.path.join(_root, "backend", "risk_engine.py"))},
        {"path": "backend/recommendation.py", "role": "Rule-based decision table mapping risk, burn severity, and spray history to IPM actions", "exists": os.path.exists(os.path.join(_root, "backend", "recommendation.py"))},
        {"path": "backend/weather_service.py", "role": "Open-Meteo real-time & forecast retrieval with offline fallback and cache tagging", "exists": os.path.exists(os.path.join(_root, "backend", "weather_service.py"))},
        {"path": "backend/config/app_config.json", "role": "Single source of truth for photo bounds, ICAR ETL threshold, and risk cutoffs", "exists": os.path.exists(app_config_file)},
        {"path": "backend/config/risk_modifiers.json", "role": "Agronomic expert priors (spray residual, variety traits, nitrogen, alternate hosts)", "exists": os.path.exists(modifiers_file)},
        {"path": "backend/config/recommendations.json", "role": "IPM decision table rules, rescout timeline calculations, and IRAC class rotation", "exists": os.path.exists(recommendations_file)},
        {"path": "src/services/api.ts", "role": "TypeScript API client interfacing with backend endpoints and multi-account state", "exists": os.path.exists(os.path.join(_root, "src", "services", "api.ts"))},
        {"path": "src/routes/_app.dashboard.tsx", "role": "Dashboard displaying latest risk badge, field history, and quick actions", "exists": os.path.exists(os.path.join(_root, "src", "routes", "_app.dashboard.tsx"))},
        {"path": "src/routes/_app.risk.tsx", "role": "3-Step Wizard: Field & Crop -> Guided 15 Photo Upload -> Review & Submission", "exists": os.path.exists(os.path.join(_root, "src", "routes", "_app.risk.tsx"))},
        {"path": "src/routes/_app.recommendations.tsx", "role": "Unified recommendation page showing risk, SHAP drivers, photo evidence, and IPM actions", "exists": os.path.exists(os.path.join(_root, "src", "routes", "_app.recommendations.tsx"))},
        {"path": "src/routes/_app.about.tsx", "role": "About & Methods page: SVG architecture pipeline, live metrics, datasets, and limitations", "exists": os.path.exists(os.path.join(_root, "src", "routes", "_app.about.tsx"))}
    ]

    datasets = [
        {
            "name": "AICRP Coimbatore Jassid & Weather Core Dataset",
            "files": ["01_Final_Jassid_Core.xlsx", "02_Jassid_Model_Ready.xlsx"],
            "source": "All India Coordinated Research Project on Cotton (AICRP), Tamil Nadu Agricultural University (TNAU) Coimbatore Center",
            "license": "Academic / Public Agricultural Research Reports",
            "size": "40 weekly observations across 4 cotton seasons (2020-21, 2022, 2023, 2024)",
            "columns": "Weekly jassid count per 3 leaves, standard meteorological week (SMW), max/min temperature, morning/evening relative humidity, rainfall, rainy days, wind speed, sunshine hours",
            "use": "Training and cross-validation of base time-series regression and classification risk models"
        },
        {
            "name": "Roboflow Universe Cotton Jassid Dataset",
            "files": ["hc147/cotton-jassid (v4)"],
            "source": "Roboflow Universe hc147 (CC BY 4.0)",
            "license": "Creative Commons Attribution 4.0 International (CC BY 4.0)",
            "size": "194 annotated leaf images (136 train, 39 val, 19 held-out test)",
            "columns": "Bounding box coordinates for adult jassids, nymphs, and cast skins (molts)",
            "use": "Training and evaluation of the YOLOv8n object detection model"
        },
        {
            "name": "Roboflow Universe Leaf Redding / Hopper Burn Reference",
            "files": ["cotton-plant-224mo/leaf-redding"],
            "source": "Roboflow Universe cotton-plant-224mo",
            "license": "Public Domain / CC BY 4.0",
            "size": "50 field images showing varying degrees of leaf reddening and margin cupping",
            "columns": "RGB leaf canopy photos with chlorotic, bronzed, and necrotic leaf margins",
            "use": "Calibration and validation of the edge-weighted HSV Hopper Burn Grader (ICCC 0-4 scale)"
        }
    ]

    limitations = [
        "Small regional sample size: The historical time-series model is trained on 40 weekly observations from Coimbatore across 4 seasons. Out-of-distribution regional weather may widen uncertainty.",
        "Image training domain: Publicly available annotated jassid datasets originate from diverse open-access cotton trials; varying camera resolutions and lighting conditions may influence nymph detection sensitivity.",
        "Expert-rule priors: Agronomic modifiers (spray knockdown and residual days, varietal pubescence, and nitrogen impacts) are currently formulated from ICAR/TNAU entomological literature as transparent multipliers rather than learned coefficients, pending longitudinal farm-level data collection.",
        "Advisory nature: Model outputs and recommendations serve as agricultural decision support only and do not replace certified field scouting or local Agricultural Extension Officer / KVK guidance."
    ]

    return {
        "pipeline_stages": [
            {"step": 1, "name": "Client Image Preparation", "file": "src/routes/_app.risk.tsx", "function": "compressImageToJpeg", "description": "Resizes long edge to 1600px and compresses to JPEG 0.85 quality client-side."},
            {"step": 2, "name": "Multipart Upload & Validation", "file": "backend/app.py", "function": "submit_field_check_and_predict", "description": "Validates 5-30 images, decodability via PIL, size limits, and parses agronomy payload."},
            {"step": 3, "name": "Vision Quality Filtering", "file": "backend/vision_detector.py", "function": "check_image_quality", "description": "Evaluates blur via Laplacian variance (< 45), lighting brightness, and foliage presence."},
            {"step": 4, "name": "Neural Pest Detection", "file": "backend/vision_detector.py", "function": "analyze_cotton_leaf_image", "description": "Runs YOLOv8n at 960 resolution to identify adults and nymphs with heuristic fallback."},
            {"step": 5, "name": "Hopper Burn Grading", "file": "backend/hopper_burn.py", "function": "grade_image", "description": "Segments leaf margins and assesses chlorosis/necrosis on the 0-4 ICCC/AICRP scale."},
            {"step": 6, "name": "Statistical Aggregation", "file": "backend/vision_detector.py", "function": "aggregate_leaf_submissions", "description": "Computes mean per leaf, variance-to-mean patchiness, 95% bootstrap CI, and confidence score."},
            {"step": 7, "name": "Real-Time Weather Retrieval", "file": "backend/weather_service.py", "function": "fetch_coimbatore_weather", "description": "Retrieves 7-day weather and forecast from Open-Meteo API with offline cache fallback."},
            {"step": 8, "name": "Base ML Risk Scoring", "file": "backend/risk_engine.py", "function": "compute_risk", "description": "Executes LOSOCV-trained model and extracts SHAP top predictive feature attributions."},
            {"step": 9, "name": "Agronomic Modifier Layer", "file": "backend/risk_engine.py", "function": "calculate_modifiers", "description": "Applies transparent multipliers for spray residual, variety hairiness, and nitrogen."},
            {"step": 10, "name": "Action Decision Table", "file": "backend/recommendation.py", "function": "get_recommendation", "description": "Maps risk class, burn severity, and spray history to specific rescout dates and IRAC rotations."},
            {"step": 11, "name": "SQLite Persistence & Audit", "file": "backend/database.py", "function": "save_prediction_submission", "description": "Saves snapshot, aggregates, and images to procrop.db under per-user isolation."}
        ],
        "detector_metrics": detector_metrics,
        "hopper_burn_metrics": hopper_metrics,
        "risk_metrics": risk_metrics,
        "app_config": app_config,
        "datasets": datasets,
        "limitations": limitations,
        "file_map": file_map
    }

# ==================== Phase 7: Authentication Endpoints ====================

@app.post("/auth/register", response_model=TokenResponse)
def register(user_in: UserRegisterInput):
    """Registers a new farmer/user and issues access token."""
    existing = get_user_by_email(user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )
    pw_hash = hash_password(user_in.password)
    user = create_user(
        user_in.email, pw_hash, user_in.name,
        role=user_in.role or "Farmer",
        location=user_in.location or "Coimbatore, Tamil Nadu"
    )
    token = create_access_token(user["id"], user["email"], user["token_version"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@app.post("/auth/login", response_model=TokenResponse)
def login(user_in: UserLoginInput):
    """Authenticates farmer credentials and issues access token."""
    user = get_user_by_email(user_in.email)
    if not user or not verify_password(user_in.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
    token = create_access_token(user["id"], user["email"], user["token_version"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user.get("role", "Farmer"),
            "location": user.get("location", "Coimbatore, Tamil Nadu"),
            "token_version": user["token_version"],
            "created_at": user.get("created_at")
        }
    }

@app.post("/auth/logout")
def logout(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Revokes the current token server-side and increments token version."""
    token = current_user.get("token")
    if token:
        revoke_token(token)
    increment_user_token_version(current_user["id"])
    return {"message": "Logged out successfully. Token invalidated."}

@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Returns profile for currently authenticated user."""
    user = get_user_by_id(current_user["id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ==================== Phase 3: Field Management Endpoints ====================

@app.get("/fields", response_model=List[FieldResponse])
def list_fields(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Lists all fields owned by the authenticated user."""
    return get_user_fields(current_user["id"])

@app.post("/fields", response_model=FieldResponse)
def create_field(field_in: FieldCreateInput, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Creates a new field record for the authenticated user."""
    new_field = create_user_field(current_user["id"], field_in.model_dump())
    return new_field

@app.get("/fields/{field_id}", response_model=FieldResponse)
def get_field(field_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Fetches a specific field owned by the authenticated user."""
    field = get_field_by_id(field_id, current_user["id"])
    if not field:
        raise HTTPException(status_code=404, detail="Field not found or access denied.")
    return field

# ==================== Phase 2, 4, 5, 6: Multi-Leaf Prediction Flow ====================

@app.post("/predict")
async def submit_field_check_and_predict(
    request: Request,
    images: Optional[List[UploadFile]] = File(None),
    payload: Optional[str] = Form(None),
    current_user: Optional[Dict[str, Any]] = None
):
    """
    Main prediction endpoint.
    Handles:
    1. Multipart 5-30 guided photo upload with JSON payload and user isolation.
    2. Fallback to legacy single JSON body if application/json content-type is received.
    """
    content_type = request.headers.get("content-type", "")

    # Legacy JSON fallback
    if "application/json" in content_type:
        try:
            body_json = await request.json()
            legacy_input = JassidPredictionInput(**body_json)
            return predict_jassid_risk_legacy(legacy_input)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {str(e)}")

    # Authenticate user if header present; otherwise assign default demo user
    auth_header = request.headers.get("authorization")
    user_id = 1
    if auth_header and auth_header.startswith("Bearer "):
        try:
            from backend.auth import decode_token, is_token_revoked
            raw_token = auth_header.split(" ")[1]
            if not is_token_revoked(raw_token):
                payload_data = decode_token(raw_token)
                user_id = int(payload_data.get("sub", 1))
        except Exception:
            pass

    # Validate image count
    config = get_app_config()
    upload_cfg = config.get("upload", {})
    min_images = upload_cfg.get("min_images", 5)
    max_images = upload_cfg.get("max_images", 30)
    max_mb = upload_cfg.get("max_image_mb", 8)

    if not images or len(images) < min_images:
        n_have = len(images) if images else 0
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Add at least {min_images} leaf photos to continue (you have {n_have}). For a reliable result take 15: 5 plants x top, middle and bottom leaf."
        )

    if len(images) > max_images:
        n_excess = len(images) - max_images
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {max_images} photos. Remove {n_excess} to continue."
        )

    # Parse payload
    parsed_payload = {}
    if payload:
        try:
            parsed_payload = json.loads(payload)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Malformed payload JSON: {str(e)}")

    submission_input = PredictionSubmissionInput(**parsed_payload)

    # Validate and process each image
    image_results = []
    saved_image_records = []
    timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

    user_upload_dir = os.path.join(UPLOADS_DIR, str(user_id), timestamp_str)
    os.makedirs(user_upload_dir, exist_ok=True)

    allowed_mimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"]

    for idx, img_file in enumerate(images):
        if img_file.content_type and img_file.content_type.lower() not in allowed_mimes:
            raise HTTPException(
                status_code=400,
                detail=f"File {img_file.filename} is not a supported image format. Please upload JPEG, PNG, or WEBP."
            )

        content = await img_file.read()
        if len(content) > max_mb * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"File {img_file.filename} exceeds {max_mb} MB limit."
            )

        # PIL Verify
        try:
            pil_test = Image.open(io.BytesIO(content))
            pil_test.verify()
        except Exception:
            raise HTTPException(
                status_code=400,
                detail=f"File {img_file.filename} could not be decoded as a valid image."
            )

        # Run vision detector & hopper burn
        res = analyze_cotton_leaf_image(content, filename=img_file.filename or f"leaf_{idx+1}.jpg")
        image_results.append(res)

        # Persist image file locally under user upload directory
        save_filename = f"leaf_{idx+1}_{img_file.filename}"
        save_path = os.path.join(user_upload_dir, save_filename)
        try:
            with open(save_path, "wb") as f_out:
                f_out.write(content)
            saved_image_records.append({
                "slot": idx + 1,
                "filename": img_file.filename,
                "saved_path": os.path.relpath(save_path, _root).replace("\\", "/"),
                "total_jassids": res.get("total", 0),
                "burn_grade": res.get("hopper_burn", {}).get("grade", 0),
                "is_valid": res.get("quality_flags", {}).get("is_valid", True),
                "quality_warning": res.get("quality_flags", {}).get("warning")
            })
        except Exception as e:
            print(f"[app] Error saving image {save_filename}: {e}")

    # Aggregate images
    aggregates = aggregate_leaf_submissions(image_results)

    # Weather retrieval
    weather = fetch_coimbatore_weather(
        lat=submission_input.latitude or 11.0168,
        lon=submission_input.longitude or 76.9558
    )

    # Previous week data
    prev_week = None
    if submission_input.field_id:
        prev_pred = get_latest_field_prediction(submission_input.field_id, user_id)
        if prev_pred:
            prev_week = {
                "source": f"Field Previous Check (#{prev_pred['id']})",
                "jassid_per_3_leaves": float(prev_pred.get("final_score", 1.0)),
                "jassid_lag_1": float(prev_pred.get("prev_week_jassid_lag_1", 1.0)),
                "jassid_lag_2": float(prev_pred.get("prev_week_jassid_lag_2", 1.0)),
                "max_temp_c": float(prev_pred.get("max_temp_c", 31.8)),
                "min_temp_c": float(prev_pred.get("min_temp_c", 22.1)),
                "rh_morning_pct": float(prev_pred.get("rh_morning_pct", 82.0)),
                "rh_evening_pct": float(prev_pred.get("rh_evening_pct", 58.0)),
                "rainfall_mm": float(prev_pred.get("rainfall_mm", 10.0)),
                "rainy_days": int(prev_pred.get("rainy_days", 1)),
                "wind_speed_kmh": float(prev_pred.get("wind_speed_kmh", 6.0)),
                "sunshine_hours": float(prev_pred.get("sunshine_hours", 6.5))
            }
    if not prev_week:
        prev_week = get_latest_previous_week_data()

    # Construct feature dictionary for ML Model
    jassid_now = aggregates["jassid_per_3_leaves"]
    jassid_lag1 = float(prev_week.get("jassid_per_3_leaves", 1.10))
    jassid_lag2 = float(prev_week.get("jassid_lag_1", 1.90))

    features_dict = {
        'jassid_per_3_leaves': jassid_now,
        'jassid_lag_1': jassid_lag1,
        'jassid_lag_2': jassid_lag2,
        'jassid_trend': round(jassid_now - jassid_lag1, 2),
        'smw': datetime.date.today().isocalendar()[1],
        'max_temp_c': float(weather["max_temp_c"]),
        'min_temp_c': float(weather["min_temp_c"]),
        'rh_morning_pct': float(weather["rh_morning_pct"]),
        'rh_evening_pct': float(weather["rh_evening_pct"]),
        'rainfall_mm': float(weather["rainfall_mm"]),
        'rainy_days': int(weather["rainy_days"]),
        'wind_speed_kmh': float(weather["wind_speed_kmh"]),
        'sunshine_hours': float(weather["sunshine_hours"]),
        'mean_temp_c': float(weather["mean_temp_c"]),
        'mean_rh_pct': float(weather["mean_rh_pct"]),
        'max_temp_c_lag_1': float(prev_week.get("max_temp_c_lag_1", weather["max_temp_c"])),
        'min_temp_c_lag_1': float(prev_week.get("min_temp_c_lag_1", weather["min_temp_c"])),
        'rh_morning_pct_lag_1': float(prev_week.get("rh_morning_pct_lag_1", weather["rh_morning_pct"])),
        'rh_evening_pct_lag_1': float(prev_week.get("rh_evening_pct_lag_1", weather["rh_evening_pct"])),
        'rainfall_mm_lag_1': float(prev_week.get("rainfall_mm_lag_1", weather["rainfall_mm"])),
        'rainy_days_lag_1': float(prev_week.get("rainy_days_lag_1", weather["rainy_days"]))
    }

    # Compute risk with management modifiers
    risk_output = compute_risk(
        features_dict=features_dict,
        image_aggregates=aggregates,
        management_inputs={
            "spray_class": submission_input.spray_product_class,
            "last_spray_date": submission_input.last_spray_date,
            "variety_trait": submission_input.variety_trait,
            "bt_status": submission_input.bt_status,
            "nitrogen_level": submission_input.nitrogen_level,
            "alternate_hosts": submission_input.alternate_hosts,
            "irrigation": submission_input.irrigation
        }
    )

    # Compute recommendations from decision table
    rec_output = get_recommendation(
        risk_class=risk_output["risk_class"],
        hopper_burn_grade=aggregates["mean_burn_grade"],
        share_burn_ge_2=aggregates["share_of_images_with_grade_ge_2"],
        last_spray_class=submission_input.spray_product_class,
        last_spray_date=submission_input.last_spray_date
    )

    # Save complete prediction into database under authenticated user
    db_record = save_prediction_submission(
        user_id=user_id,
        data={
            "field_id": submission_input.field_id,
            "field_name": submission_input.field_name,
            "image_name": f"{len(images)}_leaf_photos",
            "detected_jassid": jassid_now,
            "prev_week_smw": features_dict["smw"],
            "prev_week_jassid_lag_1": jassid_lag1,
            "prev_week_jassid_lag_2": jassid_lag2,
            "weather_source": weather["source"],
            "max_temp_c": features_dict["max_temp_c"],
            "min_temp_c": features_dict["min_temp_c"],
            "rh_morning_pct": features_dict["rh_morning_pct"],
            "rh_evening_pct": features_dict["rh_evening_pct"],
            "rainfall_mm": features_dict["rainfall_mm"],
            "rainy_days": features_dict["rainy_days"],
            "wind_speed_kmh": features_dict["wind_speed_kmh"],
            "sunshine_hours": features_dict["sunshine_hours"],
            "base_score": risk_output["base_score"],
            "compound_multiplier": risk_output["compound_multiplier"],
            "modifiers": risk_output["modifiers"],
            "final_score": risk_output["final_score"],
            "risk_class": risk_output["risk_class"],
            "confidence": risk_output["confidence"],
            "model_version": risk_output["model_version"],
            "shap_drivers": risk_output["shap_drivers"],
            "image_aggregates": aggregates,
            "weather_snapshot": weather,
            "images": saved_image_records,
            "recommendation": rec_output
        }
    )

    return {
        "prediction_id": db_record["id"],
        "field_id": submission_input.field_id,
        "field_name": submission_input.field_name,
        "risk_class": risk_output["risk_class"],
        "final_score": risk_output["final_score"],
        "score_per_leaf": risk_output["score_per_leaf"],
        "confidence": risk_output["confidence"],
        "base_score": risk_output["base_score"],
        "compound_multiplier": risk_output["compound_multiplier"],
        "modifiers": risk_output["modifiers"],
        "shap_drivers": risk_output["shap_drivers"],
        "image_aggregates": aggregates,
        "weather_snapshot": weather,
        "recommendation": rec_output,
        "images": saved_image_records,
        "per_image_results": [
            {
                "filename": r.get("filename"),
                "total": r.get("total", 0),
                "n_adults": r.get("n_adults", 0),
                "n_nymphs": r.get("n_nymphs", 0),
                "confidence": r.get("confidence", 0.0),
                "quality_flags": r.get("quality_flags", {}),
                "hopper_burn": r.get("hopper_burn", {}),
                "method_used": r.get("method_used", "yolov8n")
            }
            for r in image_results
        ],
        "created_at": db_record.get("created_at")
    }

# ==================== Predictions Retrieval Endpoints ====================

@app.get("/predictions")
def get_predictions(
    limit: int = 20,
    request: Request = None,
    current_user: Optional[Dict[str, Any]] = None
):
    """
    Returns predictions history.
    If authenticated, returns strictly the logged-in user's predictions.
    If unauthenticated, returns the public recent predictions list.
    """
    auth_header = request.headers.get("authorization") if request else None
    if auth_header and auth_header.startswith("Bearer "):
        try:
            from backend.auth import decode_token, is_token_revoked
            raw_token = auth_header.split(" ")[1]
            if not is_token_revoked(raw_token):
                payload_data = decode_token(raw_token)
                uid = int(payload_data.get("sub", 1))
                return get_user_predictions(uid, limit=limit)
        except Exception:
            pass

    return get_recent_predictions(limit=limit)

@app.get("/predictions/{prediction_id}")
def get_prediction_detail(
    prediction_id: int,
    request: Request
):
    """
    Retrieves full details for a single prediction check, ensuring user isolation.
    """
    auth_header = request.headers.get("authorization")
    user_id = 1
    if auth_header and auth_header.startswith("Bearer "):
        try:
            from backend.auth import decode_token, is_token_revoked
            raw_token = auth_header.split(" ")[1]
            if not is_token_revoked(raw_token):
                payload_data = decode_token(raw_token)
                user_id = int(payload_data.get("sub", 1))
        except Exception:
            pass

    rec = get_user_prediction_by_id(prediction_id, user_id)
    if not rec:
        # Check if record belongs to another user
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT user_id FROM predictions WHERE id = ?", (prediction_id,))
        row = cur.fetchone()
        conn.close()
        if row and row["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to view this prediction.")
        raise HTTPException(status_code=404, detail="Prediction record not found.")

    return rec

# ==================== Legacy Endpoints (Preserved for compatibility) ====================

def predict_jassid_risk_legacy(data: JassidPredictionInput) -> PredictionResponse:
    from backend.risk_engine import get_risk_models
    reg, cls, raw = get_risk_models()
    
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
        'jassid_trend': float(data.jassid_per_3_leaves - data.jassid_lag_1),
        'smw': datetime.date.today().isocalendar()[1]
    }
    
    X_df = pd.DataFrame([row_dict])
    pred_val = float(reg.predict(X_df)[0]) if reg else float(data.jassid_per_3_leaves)
    pred_val = max(0.0, round(pred_val, 2))
    
    risk_label = "HIGH" if pred_val >= 6.0 else ("MODERATE" if pred_val >= 3.0 else "LOW")
    
    explanations = []
    if raw:
        try:
            import shap
            expl = shap.TreeExplainer(raw)
            imputer = reg.named_steps.get('imputer') if hasattr(reg, 'named_steps') else None
            from scripts.train_risk_models import FEATURE_COLS
            X_c = imputer.transform(X_df[FEATURE_COLS]) if imputer else X_df[FEATURE_COLS].values
            s_vals = expl.shap_values(X_c)[0]
            for fn, sv in zip(FEATURE_COLS, s_vals):
                explanations.append({"feature": fn, "value": float(X_df[fn].iloc[0]) if fn in X_df else None, "contribution": round(float(sv), 4)})
            explanations.sort(key=lambda x: abs(x["contribution"]), reverse=True)
        except Exception:
            pass

    return PredictionResponse(
        predicted_next_week_jassid=pred_val,
        risk=risk_label,
        risk_threshold=6.0,
        model_used="RandomForest LOSOCV (Leave-One-Season-Out)",
        explanation=explanations[:5]
    )

@app.get("/weather/coimbatore")
def get_coimbatore_weather():
    return fetch_coimbatore_weather()

@app.get("/dataset/previous-week")
def get_previous_week_historical():
    return get_latest_previous_week_data()

@app.post("/analyze-leaf-image")
async def analyze_leaf_image(file: UploadFile = File(...)):
    contents = await file.read()
    return analyze_cotton_leaf_image(contents, filename=file.filename or "leaf.jpg")
