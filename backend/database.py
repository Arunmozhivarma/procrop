import os
import sqlite3
import json
from contextlib import closing
from typing import Optional

DEFAULT_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "procrop.db"))

def get_db_path():
    """Path of the application database. PROCROP_DB_PATH overrides the default location."""
    return os.path.abspath(os.environ.get("PROCROP_DB_PATH") or DEFAULT_DB_PATH)

def get_connection():
    """
    Opens the existing application database.
    Never creates a new database file: a missing file is a database error.
    """
    db_path = get_db_path()
    if not os.path.isfile(db_path):
        raise sqlite3.OperationalError(f"Database file not found: {db_path}")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """
    Ensures the SQLite tables for observations, predictions and users exist.
    The database is the single source of truth: no rows are seeded from any file.
    """
    with closing(get_connection()) as conn:
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

        # 3. Users Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        conn.commit()

def get_latest_previous_week_data():
    """
    Returns the most recent observation from the database.
    This provides previous week lags (pest count lag 1, lag 2, previous weather)
    for next-week predictions.
    """
    with closing(get_connection()) as conn:
        row = conn.execute("""
            SELECT * FROM weekly_observations
            WHERE jassid_per_3_leaves IS NOT NULL
            ORDER BY report_year DESC, smw DESC, id DESC LIMIT 1
        """).fetchone()

    if not row:
        return None
    data = dict(row)
    data["source"] = f"Database (weekly_observations #{data['id']})"
    return data

def get_observations(limit: int = 5000):
    with closing(get_connection()) as conn:
        rows = [dict(r) for r in conn.execute(
            "SELECT * FROM weekly_observations ORDER BY report_year DESC, smw DESC, id DESC LIMIT ?", (limit,)
        ).fetchall()]
    return list(reversed(rows))

def get_dataset_summary():
    with closing(get_connection()) as conn:
        cursor = conn.cursor()
        summary = dict(cursor.execute("""
            SELECT COUNT(*) AS total_rows, COUNT(DISTINCT report_year) AS year_count,
                   MIN(smw) AS first_smw, MAX(smw) AS last_smw
            FROM weekly_observations
        """).fetchone())
        years = [r[0] for r in cursor.execute(
            "SELECT DISTINCT report_year FROM weekly_observations WHERE report_year IS NOT NULL ORDER BY report_year"
        ).fetchall()]
        columns = [r[1] for r in cursor.execute("PRAGMA table_info(weekly_observations)").fetchall()]
        summary.update(years_covered=years, columns=columns, columns_count=len(columns))
        summary["sample_records"] = [dict(r) for r in cursor.execute(
            "SELECT * FROM weekly_observations ORDER BY id DESC LIMIT 5"
        ).fetchall()]
    return summary

def _prediction_from_row(row) -> dict:
    """Converts a predictions row to a dict with the stored SHAP summary parsed."""
    record = dict(row)
    record["explanation"] = []
    if record.get("shap_summary"):
        try:
            record["explanation"] = json.loads(record["shap_summary"])
        except Exception:
            record["explanation"] = []
    return record

def save_prediction_record(data: dict) -> dict:
    """
    Saves a prediction record into the SQLite predictions table.
    """
    explanation = data.get("explanation")
    shap_str = json.dumps(explanation if isinstance(explanation, list) else [])
    prev_week_smw = data.get("prev_week_smw")

    with closing(get_connection()) as conn:
        cursor = conn.cursor()
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
            data["image_name"],
            float(data["detected_jassid"]),
            int(prev_week_smw) if prev_week_smw is not None else None,
            float(data["prev_week_jassid_lag_1"]),
            float(data["prev_week_jassid_lag_2"]),
            data["weather_source"],
            float(data["max_temp_c"]),
            float(data["min_temp_c"]),
            float(data["rh_morning_pct"]),
            float(data["rh_evening_pct"]),
            float(data["rainfall_mm"]),
            int(data["rainy_days"]),
            float(data["wind_speed_kmh"]),
            float(data["sunshine_hours"]),
            float(data["predicted_next_week_jassid"]),
            data["risk"],
            float(data["risk_threshold"]),
            data["model_used"],
            shap_str
        ))
        conn.commit()
        pred_id = cursor.lastrowid

        row = cursor.execute("SELECT * FROM predictions WHERE id = ?", (pred_id,)).fetchone()
    return _prediction_from_row(row)

def get_recent_predictions(limit: int = 15):
    """
    Retrieves recent predictions from the database table.
    """
    with closing(get_connection()) as conn:
        rows = conn.execute("SELECT * FROM predictions ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
    return [_prediction_from_row(r) for r in rows]

def get_latest_prediction():
    """Returns the most recently saved prediction, or None when the table is empty."""
    rows = get_recent_predictions(limit=1)
    return rows[0] if rows else None

def normalize_email(email: str) -> str:
    return email.strip().lower()

def create_user(name: str, email: str, password_hash: str) -> dict:
    """
    Inserts a user into the users table.
    Raises sqlite3.IntegrityError when the email is already registered.
    """
    with closing(get_connection()) as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
            (name.strip(), normalize_email(email), password_hash),
        )
        conn.commit()
        row = cursor.execute("SELECT * FROM users WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return dict(row)

def get_user_by_email(email: str) -> Optional[dict]:
    with closing(get_connection()) as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (normalize_email(email),)).fetchone()
    return dict(row) if row else None

def get_user_by_id(user_id: int) -> Optional[dict]:
    with closing(get_connection()) as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return dict(row) if row else None

def update_user(user_id: int, name: str, email: str) -> Optional[dict]:
    """
    Updates a user's name and email.
    Raises sqlite3.IntegrityError when the email belongs to another user.
    """
    with closing(get_connection()) as conn:
        conn.execute(
            "UPDATE users SET name = ?, email = ? WHERE id = ?",
            (name.strip(), normalize_email(email), user_id),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return dict(row) if row else None
