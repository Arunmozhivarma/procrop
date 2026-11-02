import hashlib
import os
import shutil
import sqlite3
import sys
from contextlib import closing
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

# Tests never read or create the real session key file.
os.environ["PROCROP_SECRET_KEY"] = "test-secret-key"

REAL_DB = ROOT / "data" / "procrop.db"

STUB_WEATHER = {
    "source": "Stub Weather (tests)",
    "location": "Coimbatore, Tamil Nadu",
    "max_temp_c": 31.2,
    "min_temp_c": 22.4,
    "rh_morning_pct": 84.0,
    "rh_evening_pct": 56.0,
    "rainfall_mm": 2.5,
    "rainy_days": 1,
    "wind_speed_kmh": 6.3,
    "sunshine_hours": 6.1,
    "mean_temp_c": 26.8,
    "mean_rh_pct": 70.0,
    "timestamp": "2026-01-01 00:00:00",
}


def file_digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


@pytest.fixture(scope="session", autouse=True)
def real_database_untouched():
    """The whole suite runs on copies; the application database must be byte-identical afterwards."""
    before = file_digest(REAL_DB)
    yield
    assert file_digest(REAL_DB) == before, "tests modified data/procrop.db"


@pytest.fixture
def db_path(tmp_path, monkeypatch):
    """A private copy of the application database."""
    copy = tmp_path / "procrop.db"
    shutil.copy(REAL_DB, copy)
    monkeypatch.setenv("PROCROP_DB_PATH", str(copy))
    return copy


@pytest.fixture
def app_module(monkeypatch):
    import backend.app as module

    monkeypatch.setattr(module, "fetch_coimbatore_weather", lambda: dict(STUB_WEATHER))
    return module


@pytest.fixture
def client(db_path, app_module):
    from fastapi.testclient import TestClient

    with TestClient(app_module.app) as test_client:
        yield test_client


def query(db_path, sql, params=()):
    with closing(sqlite3.connect(db_path)) as conn:
        conn.row_factory = sqlite3.Row
        return [dict(r) for r in conn.execute(sql, params).fetchall()]


def execute(db_path, sql, params=()):
    with closing(sqlite3.connect(db_path)) as conn:
        conn.execute(sql, params)
        conn.commit()


def count(db_path, table):
    return query(db_path, f"SELECT COUNT(*) AS n FROM {table}")[0]["n"]


def latest_observation(db_path):
    return query(
        db_path,
        "SELECT * FROM weekly_observations WHERE jassid_per_3_leaves IS NOT NULL "
        "ORDER BY report_year DESC, smw DESC, id DESC LIMIT 1",
    )[0]
