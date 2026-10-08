import os
import pandas as pd
import numpy as np

# Feature Column Definitions
WEATHER_FEATURES = [
    'max_temp_c', 'min_temp_c', 'rh_morning_pct', 'rh_evening_pct',
    'rainfall_mm', 'rainy_days', 'wind_speed_kmh', 'sunshine_hours',
    'mean_temp_c', 'mean_rh_pct',
    'max_temp_c_lag_1', 'min_temp_c_lag_1', 'rh_morning_pct_lag_1',
    'rh_evening_pct_lag_1', 'rainfall_mm_lag_1', 'rainy_days_lag_1',
    'wind_speed_kmh_lag_1', 'sunshine_hours_lag_1'
]

MODEL_B_FEATURES = WEATHER_FEATURES + [
    'jassid_per_3_leaves', 'jassid_lag_1', 'jassid_lag_2'
]

REGRESSION_TARGET = 'target_next_week_jassid'
CLASSIFICATION_TARGET = 'target_high_risk_median_rule'

def load_dataset(data_path="data/02_Jassid_Model_Ready.xlsx"):
    """
    Loads the Excel dataset. Falls back to root folder if data_path does not exist.
    """
    if not os.path.exists(data_path):
        fallback = "02_Jassid_Model_Ready.xlsx"
        if os.path.exists(fallback):
            data_path = fallback
        else:
            raise FileNotFoundError(f"Dataset not found at {data_path} or {fallback}")
    
    df = pd.read_excel(data_path)
    # Ensure dataset is sorted chronologically by report_year and smw
    if 'report_year' in df.columns and 'smw' in df.columns:
        df = df.sort_values(by=['report_year', 'smw']).reset_index(drop=True)
    return df

def time_series_split(df, feature_cols, target_col, test_ratio=0.25):
    """
    Chronological train/test split (no random shuffling to preserve temporal sequence).
    """
    X = df[feature_cols].copy()
    y = df[target_col].copy()
    
    n_samples = len(df)
    n_test = int(n_samples * test_ratio)
    split_idx = n_samples - n_test
    
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
    
    return X_train, X_test, y_train, y_test
