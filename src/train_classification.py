import os
import sys
import joblib
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.preprocessing import (
    load_dataset,
    time_series_split,
    WEATHER_FEATURES,
    MODEL_B_FEATURES,
    CLASSIFICATION_TARGET,
)
from src.evaluate import evaluate_classification

def train_and_evaluate_classification(data_path="data/02_Jassid_Model_Ready.xlsx", models_dir="models"):
    os.makedirs(models_dir, exist_ok=True)
    df = load_dataset(data_path)
    
    # ── Model A: Weather Only ──
    X_tr_A, X_te_A, y_tr_A, y_te_A = time_series_split(
        df, WEATHER_FEATURES, CLASSIFICATION_TARGET, test_ratio=0.25
    )
    
    rf_A = RandomForestClassifier(n_estimators=100, max_depth=4, random_state=42)
    rf_A.fit(X_tr_A, y_tr_A)
    rf_A_metrics = evaluate_classification(y_te_A, rf_A.predict(X_te_A))
    
    xgb_A = XGBClassifier(n_estimators=100, max_depth=3, learning_rate=0.05, random_state=42, eval_metric='logloss')
    xgb_A.fit(X_tr_A, y_tr_A)
    xgb_A_metrics = evaluate_classification(y_te_A, xgb_A.predict(X_te_A))
    
    # ── Model B: Weather + Pest History ──
    X_tr_B, X_te_B, y_tr_B, y_te_B = time_series_split(
        df, MODEL_B_FEATURES, CLASSIFICATION_TARGET, test_ratio=0.25
    )
    
    rf_B = RandomForestClassifier(n_estimators=100, max_depth=4, random_state=42)
    rf_B.fit(X_tr_B, y_tr_B)
    rf_B_metrics = evaluate_classification(y_te_B, rf_B.predict(X_te_B))
    
    xgb_B = XGBClassifier(n_estimators=100, max_depth=3, learning_rate=0.05, random_state=42, eval_metric='logloss')
    xgb_B.fit(X_tr_B, y_tr_B)
    xgb_B_metrics = evaluate_classification(y_te_B, xgb_B.predict(X_te_B))
    
    # Save best classification models
    joblib.dump(rf_B, os.path.join(models_dir, "rf_classifier.pkl"))
    joblib.dump(xgb_B, os.path.join(models_dir, "xgb_classifier.pkl"))
    
    # Also save metadata
    metadata = {
        'model_a_features': WEATHER_FEATURES,
        'model_b_features': MODEL_B_FEATURES,
        'target': CLASSIFICATION_TARGET,
        'threshold_note': 'Experimental median rule: >= 1.95 Jassids/3 leaves (not ICAR ETL)',
    }
    joblib.dump(metadata, os.path.join(models_dir, "classification_metadata.pkl"))
    
    results = {
        'Model_A_RF_WeatherOnly': rf_A_metrics,
        'Model_A_XGB_WeatherOnly': xgb_A_metrics,
        'Model_B_RF_WeatherPest': rf_B_metrics,
        'Model_B_XGB_WeatherPest': xgb_B_metrics,
    }
    
    return results, xgb_B, X_te_B, y_te_B

if __name__ == "__main__":
    results, _, _, _ = train_and_evaluate_classification()
    print("=== Classification Results ===")
    for k, v in results.items():
        print(f"{k}: {v}")
