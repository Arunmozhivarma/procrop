import pandas as pd

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

def load_dataset():
    """
    Loads the model-ready dataset from the weekly_observations table of the SQLite database,
    sorted chronologically by report_year and smw.
    """
    from backend.database import get_observations

    rows = get_observations(limit=1000000)
    if not rows:
        raise ValueError("No observations are stored in weekly_observations.")
    return pd.DataFrame(rows)

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
