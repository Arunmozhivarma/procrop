import os
import sys
import datetime
from PIL import Image
import numpy as np

_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(_root)

from backend.vision_detector import analyze_cotton_leaf_image, aggregate_leaf_submissions
from backend.hopper_burn import HopperBurnGrader
from backend.risk_engine import compute_risk, calculate_modifiers
from backend.recommendation import get_recommendation
from backend.weather_service import fetch_coimbatore_weather

def run_smoke_tests():
    print("=" * 60)
    print("ProCrop End-to-End Component Smoke Test")
    print("=" * 60)

    # 1. Vision Detector & Hopper Burn Grader
    sample_img_path = os.path.join(_root, "public", "sample-leaves", "jassid_moderate_sample.jpg")
    assert os.path.exists(sample_img_path), f"Sample image {sample_img_path} not found"
    with open(sample_img_path, "rb") as f:
        img_bytes = f.read()

    print("[1/5] Testing Vision Detector (YOLOv8n + Hopper Burn)...")
    vision_res = analyze_cotton_leaf_image(img_bytes, filename="jassid_moderate_sample.jpg")
    assert "total" in vision_res and vision_res["total"] >= 0, "Invalid vision total count"
    assert "hopper_burn" in vision_res, "Missing hopper burn analysis"
    assert vision_res["hopper_burn"]["grade"] in [0, 1, 2, 3, 4], "Hopper burn grade out of 0-4 range"
    assert "quality_flags" in vision_res, "Missing quality flags"
    print(f"      OK: Detected {vision_res['total']} jassids, burn grade {vision_res['hopper_burn']['grade']} ({vision_res['hopper_burn']['label']})")

    # 2. Multi-Leaf Statistical Aggregation
    print("[2/5] Testing Statistical Aggregator (Bootstrap CI)...")
    multi_results = [vision_res] * 15
    agg_res = aggregate_leaf_submissions(multi_results)
    assert agg_res["n_images_used"] == 15, "Aggregation image count mismatch"
    assert agg_res["confidence_level"] == "High", "15 valid images should yield High confidence"
    assert "bootstrap_ci_95" in agg_res, "Missing bootstrap 95% CI"
    assert agg_res["bootstrap_ci_95"]["lower"] <= agg_res["bootstrap_ci_95"]["upper"], "Invalid CI range"
    print(f"      OK: 15-leaf mean {agg_res['mean_per_leaf']}/leaf, 95% CI [{agg_res['bootstrap_ci_95']['lower']}, {agg_res['bootstrap_ci_95']['upper']}], Confidence: {agg_res['confidence_level']}")

    # 3. Weather Service
    print("[3/5] Testing Open-Meteo Weather Service...")
    weather = fetch_coimbatore_weather()
    assert "max_temp_c" in weather and 15.0 <= weather["max_temp_c"] <= 48.0, "Temperature out of expected bounds"
    assert "rh_morning_pct" in weather and 10.0 <= weather["rh_morning_pct"] <= 100.0, "Humidity out of expected bounds"
    print(f"      OK: Weather retrieved ({weather['source']}): Max Temp {weather['max_temp_c']}°C, Morning RH {weather['rh_morning_pct']}%")

    # 4. Risk Engine & Management Modifiers
    print("[4/5] Testing Risk Engine & Expert Priors...")
    features = {
        'jassid_per_3_leaves': 4.5,
        'jassid_lag_1': 3.0,
        'jassid_lag_2': 2.0,
        'jassid_trend': 1.5,
        'smw': 40,
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
        'max_temp_c_lag_1': weather["max_temp_c"],
        'min_temp_c_lag_1': weather["min_temp_c"],
        'rh_morning_pct_lag_1': weather["rh_morning_pct"],
        'rh_evening_pct_lag_1': weather["rh_evening_pct"],
        'rainfall_mm_lag_1': weather["rainfall_mm"],
        'rainy_days_lag_1': weather["rainy_days"]
    }

    risk_res = compute_risk(
        features_dict=features,
        image_aggregates=agg_res,
        management_inputs={
            "spray_class": "botanical_neem",
            "last_spray_date": datetime.date.today().isoformat(),
            "variety_trait": "tolerant_hairy",
            "bt_status": "Bt",
            "nitrogen_level": "medium",
            "alternate_hosts": "okra",
            "irrigation": "rainfed"
        }
    )
    assert risk_res["risk_class"] in ["Low", "Medium", "High"], f"Unexpected risk class {risk_res['risk_class']}"
    assert 0.0 <= risk_res["final_score"] <= 30.0, "Risk score out of clamped range"
    assert len(risk_res["modifiers"]) >= 5, "Modifiers list incomplete"
    assert len(risk_res["shap_drivers"]) > 0, "SHAP drivers missing"
    print(f"      OK: Final Risk {risk_res['risk_class']} (Score: {risk_res['final_score']} / 3 leaves), Compound Multiplier: {risk_res['compound_multiplier']}x")

    # 5. Recommendation Decision Table
    print("[5/5] Testing IPM Recommendation Engine...")
    rec = get_recommendation(
        risk_class=risk_res["risk_class"],
        hopper_burn_grade=agg_res["mean_burn_grade"],
        share_burn_ge_2=agg_res["share_of_images_with_grade_ge_2"],
        last_spray_class="botanical_neem",
        last_spray_date=datetime.date.today().isoformat()
    )
    assert "rescout_date" in rec and "days" in rec["rescout_date"], "Invalid rescout date"
    assert len(rec["actions"]) >= 2, "Insufficient IPM actions generated"
    assert "disclaimer" in rec, "Missing advisory disclaimer"
    print(f"      OK: Rescout scheduled for {rec['rescout_date']}. Urgency: {rec['urgency']}")

    print("\n" + "=" * 60)
    print("All smoke tests passed successfully! All components valid.")
    print("=" * 60)

if __name__ == "__main__":
    run_smoke_tests()
