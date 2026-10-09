import os
import sqlite3
import json
import datetime
import pandas as pd
import numpy as np

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "procrop.db"))
EXCEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "02_Jassid_Model_Ready.xlsx"))
FALLBACK_EXCEL = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "02_Jassid_Model_Ready.xlsx"))

def get_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """
    Initializes SQLite tables for observations and predictions.
    Seeds observations from 02_Jassid_Model_Ready.xlsx if table is empty.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Historical Weekly Observations Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS weekly_observations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_year TEXT,
        smw INTEGER,
        location TEXT,
        zone TEXT,
        cotton_entry TEXT,
        condition TEXT,
        pest TEXT,
        jassid_per_3_leaves REAL,
        max_temp_c REAL,
        min_temp_c REAL,
        rh_morning_pct REAL,
        rh_evening_pct REAL,
        rainfall_mm REAL,
        rainy_days REAL,
        wind_speed_kmh REAL,
        sunshine_hours REAL,
        mean_temp_c REAL,
        mean_rh_pct REAL,
        jassid_lag_1 REAL,
        jassid_lag_2 REAL,
        rainfall_mm_lag_1 REAL,
        rainy_days_lag_1 REAL,
        max_temp_c_lag_1 REAL,
        min_temp_c_lag_1 REAL,
        rh_morning_pct_lag_1 REAL,
        rh_evening_pct_lag_1 REAL,
        wind_speed_kmh_lag_1 REAL,
        sunshine_hours_lag_1 REAL,
        target_next_week_jassid REAL,
        target_high_risk_median_rule INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Predictions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        image_name TEXT,
        detected_jassid REAL,
        prev_week_smw INTEGER,
        prev_week_jassid_lag_1 REAL,
        prev_week_jassid_lag_2 REAL,
        weather_source TEXT,
        max_temp_c REAL,
        min_temp_c REAL,
        rh_morning_pct REAL,
        rh_evening_pct REAL,
        rainfall_mm REAL,
        rainy_days INTEGER,
        wind_speed_kmh REAL,
        sunshine_hours REAL,
        predicted_next_week_jassid REAL,
        risk TEXT,
        risk_threshold REAL DEFAULT 1.95,
        model_used TEXT,
        shap_summary TEXT
    );
    """)
    #3.usertable
    # Create users table
    conn.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
""")
    conn.commit()

    # Seed observations table if empty
    cursor.execute("SELECT COUNT(*) FROM weekly_observations")
    count = cursor.fetchone()[0]
    if count == 0:
        seed_observations_from_excel(conn)

    conn.close()

def seed_observations_from_excel(conn):
    excel_file = EXCEL_PATH if os.path.exists(EXCEL_PATH) else FALLBACK_EXCEL
    if not os.path.exists(excel_file):
        return

    try:
        df = pd.read_excel(excel_file)
        # Sort chronologically
        if "report_year" in df.columns and "smw" in df.columns:
            df["report_year_clean"] = df["report_year"].astype(str).str.extract(r'(\d{4})')[0].astype(float)
            df = df.sort_values(by=["report_year_clean", "smw"]).reset_index(drop=True)
            df.drop(columns=["report_year_clean"], inplace=True, errors="ignore")

        cols_to_insert = [
            'report_year', 'smw', 'location', 'zone', 'cotton_entry', 'condition', 'pest',
            'jassid_per_3_leaves', 'max_temp_c', 'min_temp_c', 'rh_morning_pct', 'rh_evening_pct',
            'rainfall_mm', 'rainy_days', 'wind_speed_kmh', 'sunshine_hours', 'mean_temp_c', 'mean_rh_pct',
            'jassid_lag_1', 'jassid_lag_2', 'rainfall_mm_lag_1', 'rainy_days_lag_1',
            'max_temp_c_lag_1', 'min_temp_c_lag_1', 'rh_morning_pct_lag_1', 'rh_evening_pct_lag_1',
            'wind_speed_kmh_lag_1', 'sunshine_hours_lag_1', 'target_next_week_jassid', 'target_high_risk_median_rule'
        ]

        available_cols = [c for c in cols_to_insert if c in df.columns]
        placeholders = ", ".join(["?"] * len(available_cols))
        col_names = ", ".join(available_cols)

        cursor = conn.cursor()
        for _, row in df.iterrows():
            vals = [None if pd.isna(row[c]) else (int(row[c]) if isinstance(row[c], (np.integer, int)) else (float(row[c]) if isinstance(row[c], (np.floating, float)) else str(row[c]))) for c in available_cols]
            cursor.execute(f"INSERT INTO weekly_observations ({col_names}) VALUES ({placeholders})", vals)
        conn.commit()
    except Exception as e:
        print(f"Error seeding observations from Excel: {e}")

def get_latest_previous_week_data():
    """
    Returns the most recent observation from the database or Excel.
    This provides previous week lags (pest count lag 1, lag 2, previous weather)
    for next-week predictions.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM weekly_observations 
        WHERE jassid_per_3_leaves IS NOT NULL 
        ORDER BY id DESC LIMIT 1
    """)
    row = cursor.fetchone()
    conn.close()

    if row:
        data = dict(row)
        return {
            "source": f"Database (Weekly Observation #{data.get('id')})",
            "report_year": str(data.get("report_year", "2024")),
            "smw": int(data.get("smw", 45)),
            "location": str(data.get("location", "Coimbatore")),
            "jassid_per_3_leaves": float(data.get("jassid_per_3_leaves", 1.10)),
            "jassid_lag_1": float(data.get("jassid_lag_1", 3.90)),
            "jassid_lag_2": float(data.get("jassid_lag_2", 1.90)) if data.get("jassid_lag_2") is not None else 1.90,
            "max_temp_c": float(data.get("max_temp_c", 31.8)),
            "min_temp_c": float(data.get("min_temp_c", 22.1)),
            "rh_morning_pct": float(data.get("rh_morning_pct", 84.0)),
            "rh_evening_pct": float(data.get("rh_evening_pct", 56.0)),
            "rainfall_mm": float(data.get("rainfall_mm", 12.0)),
            "rainy_days": int(data.get("rainy_days", 1)) if data.get("rainy_days") is not None else 1,
            "wind_speed_kmh": float(data.get("wind_speed_kmh", 6.2)) if data.get("wind_speed_kmh") is not None else 6.2,
            "sunshine_hours": float(data.get("sunshine_hours", 6.8)) if data.get("sunshine_hours") is not None else 6.8,
            "max_temp_c_lag_1": float(data.get("max_temp_c_lag_1", 31.5)) if data.get("max_temp_c_lag_1") is not None else 31.5,
            "min_temp_c_lag_1": float(data.get("min_temp_c_lag_1", 22.4)) if data.get("min_temp_c_lag_1") is not None else 22.4,
            "rh_morning_pct_lag_1": float(data.get("rh_morning_pct_lag_1", 82.0)) if data.get("rh_morning_pct_lag_1") is not None else 82.0,
            "rh_evening_pct_lag_1": float(data.get("rh_evening_pct_lag_1", 58.0)) if data.get("rh_evening_pct_lag_1") is not None else 58.0,
            "rainfall_mm_lag_1": float(data.get("rainfall_mm_lag_1", 10.0)) if data.get("rainfall_mm_lag_1") is not None else 10.0,
            "rainy_days_lag_1": int(data.get("rainy_days_lag_1", 1)) if data.get("rainy_days_lag_1") is not None else 1,
            "wind_speed_kmh_lag_1": float(data.get("wind_speed_kmh_lag_1", 6.0)) if data.get("wind_speed_kmh_lag_1") is not None else 6.0,
            "sunshine_hours_lag_1": float(data.get("sunshine_hours_lag_1", 6.5)) if data.get("sunshine_hours_lag_1") is not None else 6.5,
        }

    # Fallback to direct Excel read if DB empty
    excel_file = EXCEL_PATH if os.path.exists(EXCEL_PATH) else FALLBACK_EXCEL
    if os.path.exists(excel_file):
        df = pd.read_excel(excel_file)
        last_row = df.iloc[-1]
        return {
            "source": f"Excel (02_Jassid_Model_Ready.xlsx row {len(df)})",
            "report_year": str(last_row.get("report_year", "2024")),
            "smw": int(last_row.get("smw", 45)),
            "location": str(last_row.get("location", "Coimbatore")),
            "jassid_per_3_leaves": float(last_row.get("jassid_per_3_leaves", 1.10)),
            "jassid_lag_1": float(last_row.get("jassid_lag_1", 3.90)),
            "jassid_lag_2": 1.90,
            "max_temp_c": float(last_row.get("max_temp_c", 31.8)),
            "min_temp_c": float(last_row.get("min_temp_c", 22.1)),
            "rh_morning_pct": float(last_row.get("rh_morning_pct", 84.0)),
            "rh_evening_pct": float(last_row.get("rh_evening_pct", 56.0)),
            "rainfall_mm": float(last_row.get("rainfall_mm", 12.0)),
            "rainy_days": 1,
            "wind_speed_kmh": 6.2,
            "sunshine_hours": 6.8,
            "max_temp_c_lag_1": float(last_row.get("max_temp_c_lag_1", 31.5)),
            "min_temp_c_lag_1": float(last_row.get("min_temp_c_lag_1", 22.4)),
            "rh_morning_pct_lag_1": float(last_row.get("rh_morning_pct_lag_1", 82.0)),
            "rh_evening_pct_lag_1": float(last_row.get("rh_evening_pct_lag_1", 58.0)),
            "rainfall_mm_lag_1": float(last_row.get("rainfall_mm_lag_1", 10.0)),
            "rainy_days_lag_1": 1,
            "wind_speed_kmh_lag_1": 6.0,
            "sunshine_hours_lag_1": 6.5,
        }

    return {
        "source": "Default Coimbatore Baseline",
        "report_year": "2024",
        "smw": 45,
        "location": "Coimbatore",
        "jassid_per_3_leaves": 1.10,
        "jassid_lag_1": 3.90,
        "jassid_lag_2": 1.90,
        "max_temp_c": 31.8,
        "min_temp_c": 22.1,
        "rh_morning_pct": 84.0,
        "rh_evening_pct": 56.0,
        "rainfall_mm": 12.0,
        "rainy_days": 1,
        "wind_speed_kmh": 6.2,
        "sunshine_hours": 6.8,
        "max_temp_c_lag_1": 31.5,
        "min_temp_c_lag_1": 22.4,
        "rh_morning_pct_lag_1": 82.0,
        "rh_evening_pct_lag_1": 58.0,
        "rainfall_mm_lag_1": 10.0,
        "rainy_days_lag_1": 1,
        "wind_speed_kmh_lag_1": 6.0,
        "sunshine_hours_lag_1": 6.5,
    }

def save_prediction_record(data: dict) -> dict:
    """
    Saves a prediction record into the SQLite predictions table.
    """
    conn = get_connection()
    cursor = conn.cursor()

    shap_str = json.dumps(data.get("explanation", [])) if isinstance(data.get("explanation"), list) else str(data.get("explanation", ""))

    cursor.execute("""
    INSERT INTO predictions (
        image_name,
        detected_jassid,
        prev_week_smw,
        prev_week_jassid_lag_1,
        prev_week_jassid_lag_2,
        weather_source,
        max_temp_c,
        min_temp_c,
        rh_morning_pct,
        rh_evening_pct,
        rainfall_mm,
        rainy_days,
        wind_speed_kmh,
        sunshine_hours,
        predicted_next_week_jassid,
        risk,
        risk_threshold,
        model_used,
        shap_summary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.get("image_name", "custom_upload.jpg"),
        float(data.get("detected_jassid", 0.0)),
        int(data.get("prev_week_smw", 45)),
        float(data.get("prev_week_jassid_lag_1", 0.0)),
        float(data.get("prev_week_jassid_lag_2", 0.0)),
        data.get("weather_source", "Open-Meteo Coimbatore API"),
        float(data.get("max_temp_c", 0.0)),
        float(data.get("min_temp_c", 0.0)),
        float(data.get("rh_morning_pct", 0.0)),
        float(data.get("rh_evening_pct", 0.0)),
        float(data.get("rainfall_mm", 0.0)),
        int(data.get("rainy_days", 0)),
        float(data.get("wind_speed_kmh", 0.0)),
        float(data.get("sunshine_hours", 0.0)),
        float(data.get("predicted_next_week_jassid", 0.0)),
        data.get("risk", "LOW"),
        float(data.get("risk_threshold", 1.95)),
        data.get("model_used", "XGBoost Model B"),
        shap_str
    ))
    conn.commit()
    pred_id = cursor.lastrowid

    cursor.execute("SELECT * FROM predictions WHERE id = ?", (pred_id,))
    row = dict(cursor.fetchone())
    conn.close()
    return row

def get_recent_predictions(limit: int = 15):
    """
    Retrieves recent predictions from the database table.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM predictions ORDER BY id DESC LIMIT ?", (limit,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    # Parse JSON shap_summary if present
    for r in rows:
        if r.get("shap_summary"):
            try:
                r["explanation"] = json.loads(r["shap_summary"])
            except Exception:
                r["explanation"] = []
    return rows
