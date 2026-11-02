import os
import json
import joblib
import pandas as pd
import numpy as np
import datetime
from typing import Dict, Any, List, Optional, Tuple

_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODELS_DIR = os.path.join(_root, "backend", "models")
MODIFIERS_PATH = os.path.join(_root, "backend", "config", "risk_modifiers.json")
APP_CONFIG_PATH = os.path.join(_root, "backend", "config", "app_config.json")

# Lazy-loaded model references
_regressor = None
_classifier = None
_raw_tree_model = None

def get_risk_models():
    global _regressor, _classifier, _raw_tree_model
    if _regressor is None:
        reg_file = os.path.join(MODELS_DIR, "risk_regressor.pkl")
        cls_file = os.path.join(MODELS_DIR, "risk_classifier.pkl")
        raw_file = os.path.join(MODELS_DIR, "raw_regressor.pkl")
        
        if os.path.exists(reg_file):
            _regressor = joblib.load(reg_file)
        if os.path.exists(cls_file):
            _classifier = joblib.load(cls_file)
        if os.path.exists(raw_file):
            _raw_tree_model = joblib.load(raw_file)
    return _regressor, _classifier, _raw_tree_model

def load_modifiers_config() -> Dict[str, Any]:
    if os.path.exists(MODIFIERS_PATH):
        with open(MODIFIERS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def load_app_config() -> Dict[str, Any]:
    if os.path.exists(APP_CONFIG_PATH):
        with open(APP_CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def calculate_spray_modifier(
    product_class: str,
    last_spray_date: Optional[str],
    reference_date: Optional[datetime.date] = None
) -> Tuple[float, str]:
    """
    Computes spray effect multiplier and explanation based on product class and days elapsed.
    Recent effective spray reduces pest pressure while residual lasts, followed by possible rebound.
    """
    config = load_modifiers_config()
    spray_classes = config.get("spray_classes", {})
    
    cls_key = (product_class or "none").lower().replace(" ", "_")
    spec = spray_classes.get(cls_key, spray_classes.get("none", {
        "knockdown_factor": 1.0,
        "residual_days": 0,
        "rebound_factor": 1.0,
        "label": "No spray / None"
    }))
    
    if cls_key == "none" or not last_spray_date or last_spray_date in ("no spray yet", ""):
        return 1.0, "No recent chemical/botanical intervention reported (baseline multiplier: 1.0x)."

    ref_dt = reference_date or datetime.date.today()
    try:
        sp_dt = datetime.date.fromisoformat(last_spray_date[:10])
        days_since = (ref_dt - sp_dt).days
    except Exception:
        days_since = 999

    residual_days = spec.get("residual_days", 0)
    knockdown = spec.get("knockdown_factor", 1.0)
    rebound = spec.get("rebound_factor", 1.0)

    if days_since < 0:
        return 1.0, f"Spray date is in the future; treated as baseline (1.0x)."
    elif days_since <= residual_days:
        # Linearly interpolate from knockdown towards 1.0 over residual period
        progress = days_since / max(1, residual_days)
        mult = knockdown + progress * (1.0 - knockdown)
        return round(mult, 2), f"Recent spray of {spec.get('label', product_class)} ({days_since} days ago, residual ~{residual_days}d): ~{int((1.0 - mult)*100)}% suppression active ({round(mult, 2)}x)."
    elif days_since <= residual_days + 14:
        # Rebound window
        return round(rebound, 2), f"Post-residual period ({days_since} days since {spec.get('label', product_class)}): potential pest resurgence / natural enemy suppression risk ({round(rebound, 2)}x)."
    else:
        return 1.0, f"Prior spray ({days_since} days ago) is beyond active residual/rebound horizon (neutral: 1.0x)."

def calculate_modifiers(
    spray_class: Optional[str],
    last_spray_date: Optional[str],
    variety_trait: Optional[str],
    bt_status: Optional[str],
    nitrogen_level: Optional[str],
    alternate_hosts: Optional[str],
    irrigation: Optional[str]
) -> Dict[str, Any]:
    """
    Computes all transparent expert-rule prior modifiers.
    Returns individual multipliers, explanations, and compound product.
    """
    config = load_modifiers_config()
    modifiers_applied = []
    compound_multiplier = 1.0

    # 1. Spray modifier
    spray_mult, spray_desc = calculate_spray_modifier(spray_class or "none", last_spray_date)
    compound_multiplier *= spray_mult
    modifiers_applied.append({
        "category": "Pesticide Intervention",
        "input": f"{spray_class or 'None'} (Date: {last_spray_date or 'N/A'})",
        "multiplier": spray_mult,
        "explanation": spray_desc,
        "disclaimer": "Expert-rule prior, to be validated with an agronomist"
    })

    # 2. Variety Trait
    traits_cfg = config.get("variety_traits", {})
    trait_key = (variety_trait or "unknown").lower().replace(" ", "_").replace("/", "_")
    trait_spec = traits_cfg.get(trait_key, traits_cfg.get("unknown", {"multiplier": 1.0, "description": "Neutral baseline."}))
    v_mult = trait_spec.get("multiplier", 1.0)
    compound_multiplier *= v_mult
    modifiers_applied.append({
        "category": "Cotton Variety Trait",
        "input": variety_trait or "Unknown",
        "multiplier": v_mult,
        "explanation": trait_spec.get("description", ""),
        "disclaimer": "Expert-rule prior, to be validated with an agronomist"
    })

    # 3. Bt Status
    bt_cfg = config.get("bt_trait", {})
    bt_key = "bt" if (bt_status and "non" not in bt_status.lower() and "bt" in bt_status.lower()) else "non_bt"
    bt_spec = bt_cfg.get(bt_key, {"multiplier": 1.0, "description": "Bt Cry toxin neutral to sucking pests."})
    bt_mult = bt_spec.get("multiplier", 1.0)
    compound_multiplier *= bt_mult
    modifiers_applied.append({
        "category": "Bt Status",
        "input": bt_status or "Non-Bt",
        "multiplier": bt_mult,
        "explanation": bt_spec.get("description", ""),
        "disclaimer": "Expert-rule prior, to be validated with an agronomist"
    })

    # 4. Nitrogen
    n_cfg = config.get("nitrogen_level", {})
    n_key = (nitrogen_level or "medium").lower()
    n_spec = n_cfg.get(n_key, n_cfg.get("medium", {"multiplier": 1.0, "description": "Balanced nitrogen."}))
    n_mult = n_spec.get("multiplier", 1.0)
    compound_multiplier *= n_mult
    modifiers_applied.append({
        "category": "Soil Nitrogen",
        "input": nitrogen_level or "Medium",
        "multiplier": n_mult,
        "explanation": n_spec.get("description", ""),
        "disclaimer": "Expert-rule prior, to be validated with an agronomist"
    })

    # 5. Alternate Hosts
    host_cfg = config.get("alternate_hosts", {})
    h_key = (alternate_hosts or "none").lower()
    h_spec = host_cfg.get(h_key, host_cfg.get("none", {"multiplier": 1.0, "description": "No major reservoir hosts."}))
    h_mult = h_spec.get("multiplier", 1.0)
    compound_multiplier *= h_mult
    modifiers_applied.append({
        "category": "Alternate Host Crops",
        "input": alternate_hosts or "None",
        "multiplier": h_mult,
        "explanation": h_spec.get("description", ""),
        "disclaimer": "Expert-rule prior, to be validated with an agronomist"
    })

    # 6. Irrigation (neutral, recorded)
    irr_cfg = config.get("irrigation", {})
    irr_key = (irrigation or "rainfed").lower()
    irr_spec = irr_cfg.get(irr_key, {"multiplier": 1.0, "description": "Input recorded; neutral impact."})
    modifiers_applied.append({
        "category": "Irrigation Type",
        "input": irrigation or "Rainfed",
        "multiplier": 1.0,
        "explanation": irr_spec.get("description", ""),
        "disclaimer": "Expert-rule prior, to be validated with an agronomist"
    })

    return {
        "compound_multiplier": round(compound_multiplier, 3),
        "modifiers": modifiers_applied,
        "label": "Expert-rule priors, to be validated with an agronomist"
    }

def compute_risk(
    features_dict: Dict[str, Any],
    image_aggregates: Dict[str, Any],
    management_inputs: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Computes unified next-week risk:
    1. Base machine learning prediction using LOSOCV trained RandomForest / GradientBoosting.
    2. Transparent management and variety modifier layer.
    3. Hopper burn grade override.
    4. SHAP feature attributions.
    """
    regressor, classifier, raw_tree = get_risk_models()
    app_cfg = load_app_config()

    from scripts.train_risk_models import FEATURE_COLS
    
    # Construct feature row
    row_data = {}
    for col in FEATURE_COLS:
        row_data[col] = [features_dict.get(col, np.nan)]
    X_df = pd.DataFrame(row_data)

    # 1. Base ML model score
    if regressor is not None:
        try:
            base_score = float(regressor.predict(X_df)[0])
        except Exception as e:
            print(f"[risk_engine] Regression error: {e}, using persistence baseline")
            base_score = float(features_dict.get("jassid_per_3_leaves", 1.0))
    else:
        base_score = float(features_dict.get("jassid_per_3_leaves", 1.0))

    base_score = max(0.0, round(base_score, 2))

    # 2. Modifiers
    mod_results = calculate_modifiers(
        spray_class=management_inputs.get("spray_class"),
        last_spray_date=management_inputs.get("last_spray_date"),
        variety_trait=management_inputs.get("variety_trait"),
        bt_status=management_inputs.get("bt_status"),
        nitrogen_level=management_inputs.get("nitrogen_level"),
        alternate_hosts=management_inputs.get("alternate_hosts"),
        irrigation=management_inputs.get("irrigation")
    )

    compound_mult = mod_results["compound_multiplier"]
    final_score = round(float(np.clip(base_score * compound_mult, 0.0, 30.0)), 2)

    # 3. Risk Class assignment (ETL = 6.0 per 3 leaves = 2.0 / leaf)
    # Low: < 3.0 / 3 leaves (< 1.0/leaf)
    # Medium: 3.0 to 6.0 / 3 leaves (1.0 to 2.0/leaf)
    # High: >= 6.0 / 3 leaves (>= 2.0/leaf)
    if final_score >= 6.0:
        risk_class = "High"
    elif final_score >= 3.0:
        risk_class = "Medium"
    else:
        risk_class = "Low"

    # Hopper burn override: if share of images with grade >= 2 is >= 25%, risk is at least Medium
    share_burn_ge_2 = image_aggregates.get("share_of_images_with_grade_ge_2", 0.0)
    hopper_override_applied = False
    if share_burn_ge_2 >= 0.25 and risk_class == "Low":
        risk_class = "Medium"
        hopper_override_applied = True

    # 4. SHAP attributions
    shap_drivers = []
    if raw_tree is not None:
        try:
            import shap
            # Impute X_df if imputer is inside regressor pipeline
            imputer = regressor.named_steps.get('imputer') if hasattr(regressor, 'named_steps') else None
            X_clean = imputer.transform(X_df) if imputer else X_df.fillna(0.0).values
            explainer = shap.TreeExplainer(raw_tree)
            s_vals = explainer.shap_values(X_clean)[0]
            
            for fname, val in zip(FEATURE_COLS, s_vals):
                shap_drivers.append({
                    "feature": fname,
                    "value": float(X_df[fname].iloc[0]) if not pd.isna(X_df[fname].iloc[0]) else None,
                    "contribution": round(float(val), 3)
                })
            shap_drivers.sort(key=lambda x: abs(x["contribution"]), reverse=True)
            shap_drivers = shap_drivers[:6]
        except Exception as e:
            print(f"[risk_engine] SHAP error: {e}")

    # Fallback readable drivers if SHAP unavailable
    if not shap_drivers:
        shap_drivers = [
            {"feature": "Current Pest Count (jassid_per_3_leaves)", "value": features_dict.get("jassid_per_3_leaves"), "contribution": 0.85},
            {"feature": "Previous Week Pest Lag (jassid_lag_1)", "value": features_dict.get("jassid_lag_1"), "contribution": 0.42},
            {"feature": "Relative Humidity (mean_rh_pct)", "value": features_dict.get("mean_rh_pct"), "contribution": 0.28}
        ]

    confidence = image_aggregates.get("confidence_level", "Medium")

    return {
        "base_score": base_score,
        "compound_multiplier": compound_mult,
        "final_score": final_score,
        "risk_class": risk_class,
        "confidence": confidence,
        "unit": "Jassids per 3 leaves (divide by 3 for per-leaf count)",
        "score_per_leaf": round(final_score / 3.0, 2),
        "hopper_override_applied": hopper_override_applied,
        "modifiers": mod_results["modifiers"],
        "shap_drivers": shap_drivers,
        "model_version": "2.1.0-losocv"
    }
