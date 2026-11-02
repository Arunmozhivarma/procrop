import os
import sqlite3
import json
import datetime
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional

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
    Initializes SQLite database idempotently with tables:
    - users (authentication and token versioning)
    - revoked_tokens (explicit server-side revocation)
    - fields (per-user fields and crop traits)
    - weekly_observations (AICRP Coimbatore dataset)
    - predictions (per-user predictions, aggregates, modifiers, recommendations)
    """
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'Farmer',
        location TEXT DEFAULT 'Coimbatore, Tamil Nadu',
        token_version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("PRAGMA table_info(users)")
    existing_user_cols = {row["name"] for row in cursor.fetchall()}
    if "role" not in existing_user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'Farmer';")
    if "location" not in existing_user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN location TEXT DEFAULT 'Coimbatore, Tamil Nadu';")

    # 2. Revoked Tokens Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS revoked_tokens (
        token TEXT PRIMARY KEY,
        revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 3. Fields Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        lat REAL,
        lon REAL,
        district TEXT,
        sowing_date TEXT,
        variety TEXT,
        variety_trait TEXT,
        bt_status TEXT,
        nitrogen_level TEXT,
        irrigation TEXT,
        alternate_hosts TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
    """)

    # 4. Historical Weekly Observations Table
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

    # 5. Predictions Table (Idempotent base + safe column additions)
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
        risk_threshold REAL DEFAULT 6.0,
        model_used TEXT,
        shap_summary TEXT
    );
    """)

    # Idempotent Column Additions for predictions table
    cursor.execute("PRAGMA table_info(predictions)")
    existing_cols = {row["name"] for row in cursor.fetchall()}

    new_columns = {
        "user_id": "INTEGER",
        "field_id": "INTEGER",
        "field_name": "TEXT",
        "image_aggregates_json": "TEXT",
        "base_score": "REAL",
        "compound_multiplier": "REAL",
        "modifiers_json": "TEXT",
        "final_score": "REAL",
        "risk_class": "TEXT",
        "confidence": "TEXT",
        "model_version": "TEXT",
        "weather_snapshot_json": "TEXT",
        "images_json": "TEXT",
        "recommendation_json": "TEXT",
        "actual_outcome_jassid": "REAL"
    }

    for col_name, col_type in new_columns.items():
        if col_name not in existing_cols:
            cursor.execute(f"ALTER TABLE predictions ADD COLUMN {col_name} {col_type};")

    conn.commit()

    # Seed observations table if empty
    cursor.execute("SELECT COUNT(*) FROM weekly_observations")
    count = cursor.fetchone()[0]
    if count == 0:
        seed_observations_from_excel(conn)

    # Seed demo accounts if missing (Ramesh Kumar & Dr. S. Kavitha)
    seed_demo_accounts_if_missing(conn)

    conn.close()

def seed_demo_accounts_if_missing(conn):
    """Seeds the two required demo accounts with fields and checks if not present."""
    cursor = conn.cursor()
    demo_pw_hash = "$2b$12$w9XNRZDRSx4J2A/x7ZocxuL6YLrHaHoBsCxaGnNH21qtYOSCUMFZW"  # 'password123'

    # 1. Ramesh Kumar (Farmer, Coimbatore)
    cursor.execute("SELECT id FROM users WHERE LOWER(email) = 'farmer@procrop.in'")
    farmer_row = cursor.fetchone()
    if not farmer_row:
        cursor.execute(
            "INSERT INTO users (email, password_hash, name, role, location) VALUES (?, ?, ?, ?, ?)",
            ("farmer@procrop.in", demo_pw_hash, "Ramesh Kumar", "Farmer", "Coimbatore, Tamil Nadu")
        )
        farmer_id = cursor.lastrowid
        cursor.execute("""
            INSERT INTO fields (user_id, name, lat, lon, district, sowing_date, variety, variety_trait, bt_status, nitrogen_level, irrigation, alternate_hosts)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (farmer_id, "Coimbatore North Block", 11.0168, 76.9558, "Coimbatore", "2026-08-15", "RCH 659 Bt", "tolerant_hairy", "bt", "medium", "drip", "none"))
        f1_id = cursor.lastrowid

        cursor.execute("""
            INSERT INTO fields (user_id, name, lat, lon, district, sowing_date, variety, variety_trait, bt_status, nitrogen_level, irrigation, alternate_hosts)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (farmer_id, "Sulur South Acre", 11.0284, 77.1264, "Coimbatore", "2026-08-20", "Suraj Non-Bt", "susceptible", "non_bt", "high", "rainfed", "okra"))

        checks = [
            {
                "created_at": "2026-10-18 10:30:00",
                "detected_jassid": 2.8,
                "base_score": 2.4,
                "compound_multiplier": 0.88,
                "final_score": 2.11,
                "risk_class": "Low",
                "confidence": "High",
                "mean_burn": 0.4,
                "share_ge_2": 0.0,
                "rescout_date": "October 25, 2026 (in 7 days)",
                "rescout_days": 7,
                "urgency": "Standard Advisory",
                "headline": "Risk Below Economic Threshold",
                "spray_guidance": "No chemical intervention needed. Conserve predatory coccinellids and spiders.",
                "actions": ["Scout 15 leaves across 5 plants next week.", "Conserve natural predator populations."]
            },
            {
                "created_at": "2026-10-25 09:15:00",
                "detected_jassid": 4.5,
                "base_score": 4.2,
                "compound_multiplier": 0.88,
                "final_score": 3.70,
                "risk_class": "Medium",
                "confidence": "High",
                "mean_burn": 1.1,
                "share_ge_2": 0.13,
                "rescout_date": "October 30, 2026 (in 5 days)",
                "rescout_days": 5,
                "urgency": "Heightened Surveillance",
                "headline": "Moderate Risk Approaching ETL",
                "spray_guidance": "Consult local KVK or extension officer. Prepare botanical/neem treatment if counts escalate.",
                "actions": ["Scout field in 5 days.", "Install 5 yellow sticky traps per acre.", "Withhold heavy nitrogen application."]
            },
            {
                "created_at": "2026-11-01 11:00:00",
                "detected_jassid": 7.2,
                "base_score": 7.0,
                "compound_multiplier": 0.88,
                "final_score": 6.16,
                "risk_class": "High",
                "confidence": "High",
                "mean_burn": 1.8,
                "share_ge_2": 0.27,
                "rescout_date": "November 04, 2026 (in 3 days)",
                "rescout_days": 3,
                "urgency": "Action Needed",
                "headline": "High Jassid Risk - ETL Breached (6.16 / 3 leaves)",
                "spray_guidance": "Field counts exceed economic threshold (2.0/leaf). Consult local extension officer before spraying. If chemical intervention is recommended, target application within 48 hours during calm weather. Rotate IRAC chemical class from previous treatment to prevent resistance.",
                "actions": ["Scout field in 3 days.", "Inspect leaf undersides across 5 plants.", "Check neighboring okra/brinjal weed hosts.", "Consult local agriculture officer / KVK."]
            }
        ]

        for ch in checks:
            agg_json = json.dumps({
                "n_images_uploaded": 15,
                "n_images_used": 15,
                "n_images_rejected": 0,
                "mean_per_leaf": round(ch["detected_jassid"] / 3.0, 2),
                "jassid_per_3_leaves": ch["detected_jassid"],
                "total_pests_counted": int(ch["detected_jassid"] * 5),
                "total_adults": int(ch["detected_jassid"] * 1.5),
                "total_nymphs": int(ch["detected_jassid"] * 3.5),
                "sd": 0.42,
                "cv": 0.52,
                "variance_to_mean_ratio": 0.28,
                "bootstrap_ci_95": {
                    "lower": round(ch["detected_jassid"] * 0.85, 2),
                    "upper": round(ch["detected_jassid"] * 1.15, 2)
                },
                "mean_burn_grade": ch["mean_burn"],
                "share_of_images_with_grade_ge_2": ch["share_ge_2"],
                "confidence_level": ch["confidence"]
            })
            weather_json = json.dumps({
                "source": "Open-Meteo Coimbatore Forecast",
                "max_temp_c": 32.4,
                "min_temp_c": 22.8,
                "rh_morning_pct": 84.0,
                "rh_evening_pct": 58.0,
                "rainfall_mm": 2.5,
                "rainy_days": 0,
                "forecast_7d_rainfall_mm": 4.2,
                "forecast_7d_max_temp_mean": 32.1,
                "is_weather_available": True,
                "weather_flag": "LIVE_OPEN_METEO"
            })
            rec_json = json.dumps({
                "risk_class": ch["risk_class"],
                "urgency": ch["urgency"],
                "headline": ch["headline"],
                "rescout_date": ch["rescout_date"],
                "rescout_days": ch["rescout_days"],
                "actions": ch["actions"],
                "spray_guidance": ch["spray_guidance"],
                "rotation_note": "If neonicotinoid (IRAC 4A) was used previously, rotate to chordotonal organ TRPV modulator (IRAC 9B / Flonicamid) or sulfoximine (IRAC 4C / Sulfoxaflor) to manage resistance.",
                "disclaimer": "Advisory only. Model outputs are decision-support estimates and do not replace an agronomist's field assessment. Verify local regulations and label directions before applying any crop protection product."
            })
            mods_json = json.dumps([
                {"category": "variety_trait", "input": "tolerant_hairy", "multiplier": 0.88, "explanation": "Dense leaf pubescence impairs jassid nymph feeding (-12% multiplier)", "disclaimer": "Prior based on ICAR/TNAU varietal screening."}
            ])
            shap_json = json.dumps([
                {"feature": "Current Leafhopper Count", "value": ch["detected_jassid"], "contribution": 1.45},
                {"feature": "Max Temperature (32.4 C)", "value": 32.4, "contribution": 0.82},
                {"feature": "Morning RH (84%)", "value": 84.0, "contribution": 0.35},
                {"feature": "Rainfall (2.5 mm)", "value": 2.5, "contribution": -0.40}
            ])
            img_records = json.dumps([
                {"slot": i+1, "filename": f"leaf_{i+1}.jpg", "saved_path": f"data/uploads/demo/leaf_{i+1}.jpg", "total_jassids": 1, "burn_grade": 1.0, "is_valid": True}
                for i in range(15)
            ])
            cursor.execute("""
                INSERT INTO predictions (
                    user_id, field_id, field_name, image_name, detected_jassid, prev_week_smw,
                    prev_week_jassid_lag_1, prev_week_jassid_lag_2, weather_source,
                    max_temp_c, min_temp_c, rh_morning_pct, rh_evening_pct, rainfall_mm, rainy_days,
                    wind_speed_kmh, sunshine_hours, predicted_next_week_jassid, risk, risk_threshold,
                    model_used, shap_summary, image_aggregates_json, base_score, compound_multiplier,
                    modifiers_json, final_score, risk_class, confidence, model_version,
                    weather_snapshot_json, images_json, recommendation_json, created_at
                ) VALUES (
                    ?, ?, ?, ?, ?, ?,
                    ?, ?, ?,
                    ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?
                )
            """, (
                farmer_id, f1_id, "Coimbatore North Block", "15_leaf_photos", ch["detected_jassid"], 44,
                2.5, 1.8, "Open-Meteo",
                32.4, 22.8, 84.0, 58.0, 2.5, 0,
                5.8, 7.1, ch["final_score"], ch["risk_class"].upper(), 6.0,
                "GradientBoostingRegressor (LOSOCV tuned)", shap_json, agg_json, ch["base_score"], ch["compound_multiplier"],
                mods_json, ch["final_score"], ch["risk_class"], ch["confidence"], "2.0.0-losocv",
                weather_json, img_records, rec_json, ch["created_at"]
            ))

    # 2. Dr. S. Kavitha (Extension Officer, TNAU)
    cursor.execute("SELECT id FROM users WHERE LOWER(email) = 'officer@tnau.ac.in'")
    officer_row = cursor.fetchone()
    if not officer_row:
        cursor.execute(
            "INSERT INTO users (email, password_hash, name, role, location) VALUES (?, ?, ?, ?, ?)",
            ("officer@tnau.ac.in", demo_pw_hash, "Dr. S. Kavitha", "Extension Officer", "TNAU Extension, Coimbatore")
        )
        officer_id = cursor.lastrowid
        fields_data = [
            ("TNAU Research Plot 4", 11.0123, 76.9356, "Coimbatore", "2026-08-01", "MCU 5", "tolerant_hairy", "non_bt", "medium", "drip", "none"),
            ("Tiruppur Demo Field", 11.1085, 77.3411, "Tiruppur", "2026-08-10", "RCH 659 Bt", "tolerant_hairy", "bt", "medium", "drip", "none"),
            ("Perambalur Rainfed Block", 11.2333, 78.8833, "Perambalur", "2026-08-25", "Suraj Non-Bt", "susceptible", "non_bt", "low", "rainfed", "brinjal"),
            ("Salem Hybrid Trial", 11.6643, 78.1460, "Salem", "2026-08-12", "Bunny Bt", "unknown", "bt", "high", "flood", "okra"),
            ("Madurai South Demonstration", 9.9252, 78.1198, "Madurai", "2026-08-18", "SVPR 2", "tolerant_hairy", "non_bt", "medium", "drip", "none")
        ]
        for f_name, f_lat, f_lon, f_dist, f_sow, f_var, f_trait, f_bt, f_nit, f_irr, f_host in fields_data:
            cursor.execute("""
                INSERT INTO fields (user_id, name, lat, lon, district, sowing_date, variety, variety_trait, bt_status, nitrogen_level, irrigation, alternate_hosts)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (officer_id, f_name, f_lat, f_lon, f_dist, f_sow, f_var, f_trait, f_bt, f_nit, f_irr, f_host))
            f_id = cursor.lastrowid

            cursor.execute("""
                INSERT INTO predictions (
                    user_id, field_id, field_name, image_name, detected_jassid, prev_week_smw,
                    weather_source, predicted_next_week_jassid, risk, risk_threshold,
                    model_used, final_score, risk_class, confidence, model_version, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-3 days'))
            """, (officer_id, f_id, f_name, "15_leaf_photos", 3.4, 44, "Open-Meteo", 3.2, "LOW", 6.0, "GradientBoostingRegressor (LOSOCV tuned)", 3.2, "Low", "High", "2.0.0-losocv"))

    conn.commit()

def seed_observations_from_excel(conn):
    excel_file = EXCEL_PATH if os.path.exists(EXCEL_PATH) else FALLBACK_EXCEL
    if not os.path.exists(excel_file):
        return

    try:
        df = pd.read_excel(excel_file)
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

# ==================== User & Auth Functions ====================

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (email.strip(),))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, name, role, location, token_version, created_at FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def create_user(email: str, password_hash: str, name: str, role: str = "Farmer", location: str = "Coimbatore, Tamil Nadu") -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO users (email, password_hash, name, role, location) VALUES (?, ?, ?, ?, ?)",
        (email.strip().lower(), password_hash, name.strip(), role, location)
    )
    conn.commit()
    user_id = cursor.lastrowid
    cursor.execute("SELECT id, email, name, role, location, token_version, created_at FROM users WHERE id = ?", (user_id,))
    user = dict(cursor.fetchone())
    conn.close()
    return user

def increment_user_token_version(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET token_version = token_version + 1 WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()

def revoke_token(token: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT OR IGNORE INTO revoked_tokens (token) VALUES (?)", (token,))
    conn.commit()
    conn.close()

def is_token_revoked(token: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM revoked_tokens WHERE token = ?", (token,))
    row = cursor.fetchone()
    conn.close()
    return bool(row)

# ==================== Fields CRUD (Per-User) ====================

def get_user_fields(user_id: int) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM fields WHERE user_id = ? ORDER BY id DESC", (user_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def get_field_by_id(field_id: int, user_id: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM fields WHERE id = ? AND user_id = ?", (field_id, user_id))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def create_user_field(user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO fields (
        user_id, name, lat, lon, district, sowing_date, variety,
        variety_trait, bt_status, nitrogen_level, irrigation, alternate_hosts
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        data.get("name", "My Cotton Field"),
        float(data.get("lat", 11.0168)) if data.get("lat") is not None else None,
        float(data.get("lon", 76.9558)) if data.get("lon") is not None else None,
        data.get("district", "Coimbatore"),
        data.get("sowing_date"),
        data.get("variety", "Hybrid Cotton"),
        data.get("variety_trait", "unknown"),
        data.get("bt_status", "Bt"),
        data.get("nitrogen_level", "medium"),
        data.get("irrigation", "rainfed"),
        data.get("alternate_hosts", "none")
    ))
    conn.commit()
    field_id = cursor.lastrowid
    cursor.execute("SELECT * FROM fields WHERE id = ?", (field_id,))
    row = dict(cursor.fetchone())
    conn.close()
    return row

# ==================== Predictions & Observations ====================

def get_latest_previous_week_data():
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

def save_prediction_submission(user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Saves a comprehensive prediction check scoped to a user and optional field.
    Stores all inputs, aggregates, modifiers, weather snapshot, and recommendation.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO predictions (
        user_id,
        field_id,
        field_name,
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
        shap_summary,
        image_aggregates_json,
        base_score,
        compound_multiplier,
        modifiers_json,
        final_score,
        risk_class,
        confidence,
        model_version,
        weather_snapshot_json,
        images_json,
        recommendation_json
    ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?
    )
    """, (
        user_id,
        data.get("field_id"),
        data.get("field_name", "Primary Cotton Plot"),
        data.get("image_name", "batch_upload"),
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
        float(data.get("final_score", data.get("predicted_next_week_jassid", 0.0))),
        data.get("risk_class", "Low"),
        6.0,
        data.get("model_used", "RandomForest LOSOCV"),
        json.dumps(data.get("shap_drivers", [])),
        json.dumps(data.get("image_aggregates", {})),
        float(data.get("base_score", 0.0)),
        float(data.get("compound_multiplier", 1.0)),
        json.dumps(data.get("modifiers", [])),
        float(data.get("final_score", 0.0)),
        data.get("risk_class", "Low"),
        data.get("confidence", "Medium"),
        data.get("model_version", "2.1.0-losocv"),
        json.dumps(data.get("weather_snapshot", {})),
        json.dumps(data.get("images", [])),
        json.dumps(data.get("recommendation", {}))
    ))
    conn.commit()
    pred_id = cursor.lastrowid
    
    cursor.execute("SELECT * FROM predictions WHERE id = ?", (pred_id,))
    row = parse_prediction_row(dict(cursor.fetchone()))
    conn.close()
    return row

def parse_prediction_row(row: Dict[str, Any]) -> Dict[str, Any]:
    """Helper to deserialize stored JSON blobs in prediction records."""
    for json_col in [
        "shap_summary", "image_aggregates_json", "modifiers_json",
        "weather_snapshot_json", "images_json", "recommendation_json"
    ]:
        if row.get(json_col):
            try:
                clean_key = json_col.replace("_json", "")
                if clean_key == "shap_summary":
                    clean_key = "shap_drivers"
                row[clean_key] = json.loads(row[json_col])
            except Exception:
                row[clean_key] = None
    return row

def get_user_predictions(user_id: int, limit: int = 25) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM predictions 
        WHERE user_id = ? 
        ORDER BY id DESC LIMIT ?
    """, (user_id, limit))
    rows = [parse_prediction_row(dict(r)) for r in cursor.fetchall()]
    conn.close()
    return rows

def get_user_prediction_by_id(pred_id: int, user_id: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM predictions 
        WHERE id = ? AND user_id = ?
    """, (pred_id, user_id))
    row = cursor.fetchone()
    conn.close()
    return parse_prediction_row(dict(row)) if row else None

def get_latest_field_prediction(field_id: int, user_id: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM predictions 
        WHERE field_id = ? AND user_id = ? 
        ORDER BY id DESC LIMIT 1
    """, (field_id, user_id))
    row = cursor.fetchone()
    conn.close()
    return parse_prediction_row(dict(row)) if row else None

# Backwards compatible legacy functions
def save_prediction_record(data: dict) -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    shap_str = json.dumps(data.get("explanation", [])) if isinstance(data.get("explanation"), list) else str(data.get("explanation", ""))
    cursor.execute("""
    INSERT INTO predictions (
        image_name, detected_jassid, prev_week_smw, prev_week_jassid_lag_1, prev_week_jassid_lag_2,
        weather_source, max_temp_c, min_temp_c, rh_morning_pct, rh_evening_pct, rainfall_mm,
        rainy_days, wind_speed_kmh, sunshine_hours, predicted_next_week_jassid, risk,
        risk_threshold, model_used, shap_summary
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
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM predictions ORDER BY id DESC LIMIT ?", (limit,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    for r in rows:
        if r.get("shap_summary"):
            try:
                r["explanation"] = json.loads(r["shap_summary"])
            except Exception:
                r["explanation"] = []
    return rows
