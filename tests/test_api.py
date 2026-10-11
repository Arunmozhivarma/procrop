import re

import pytest

from conftest import ROOT, STUB_WEATHER, count, execute, latest_observation, query

SAMPLE_LEAF = ROOT / "public" / "sample-leaves" / "jassid_moderate_sample.jpg"

MANUAL_INPUT = {
    "jassid_per_3_leaves": 2.4,
    "jassid_lag_1": 1.9,
    "jassid_lag_2": 1.5,
    "max_temp_c": 31.0,
    "min_temp_c": 22.0,
    "rh_morning_pct": 88.0,
    "rh_evening_pct": 58.0,
    "rainfall_mm": 4.0,
    "rainy_days": 1,
    "wind_speed_kmh": 6.0,
    "sunshine_hours": 5.5,
    "max_temp_c_lag_1": 30.5,
    "min_temp_c_lag_1": 21.8,
    "rh_morning_pct_lag_1": 90.0,
    "rh_evening_pct_lag_1": 60.0,
    "rainfall_mm_lag_1": 10.0,
    "rainy_days_lag_1": 2,
    "wind_speed_kmh_lag_1": 5.5,
    "sunshine_hours_lag_1": 4.8,
}


def leaf_upload(name="field_photo.jpg"):
    return {"file": (name, SAMPLE_LEAF.read_bytes(), "image/jpeg")}


# ── No Excel anywhere ────────────────────────────────────────────────────────


def test_source_has_no_spreadsheet_access():
    pattern = re.compile(r"read_excel|read_csv|openpyxl|ExcelFile|\.xlsx|\.xls\b|\.csv\b")
    offenders = []
    for folder, suffixes in (("backend", {".py"}), ("src", {".py", ".ts", ".tsx"})):
        for path in (ROOT / folder).rglob("*"):
            if path.suffix in suffixes and "__pycache__" not in path.parts:
                if pattern.search(path.read_text(encoding="utf-8")):
                    offenders.append(str(path.relative_to(ROOT)))
    assert offenders == []


def test_every_endpoint_works_with_spreadsheet_readers_disabled(client, db_path, monkeypatch):
    import pandas as pd

    def forbidden(*args, **kwargs):
        raise AssertionError("application code tried to read a spreadsheet")

    monkeypatch.setattr(pd, "read_excel", forbidden)
    monkeypatch.setattr(pd, "read_csv", forbidden)
    monkeypatch.setattr(pd, "ExcelFile", forbidden)

    for path in (
        "/",
        "/weather/coimbatore",
        "/dataset/previous-week",
        "/dataset/summary",
        "/dataset/observations",
        "/predictions",
        "/predictions/latest",
    ):
        assert client.get(path).status_code == 200, path

    assert client.post("/predict", json=MANUAL_INPUT).status_code == 200
    assert client.post("/dataset/predict-latest").status_code == 200
    assert client.post("/predict-unified", data={"override_jassid": "1.1"}).status_code == 200
    assert client.post("/auto-predict", files=leaf_upload()).status_code == 200
    assert client.post("/analyze-leaf-image", files=leaf_upload()).status_code == 200

    from src.preprocessing import load_dataset

    assert len(load_dataset()) == count(db_path, "weekly_observations")


# ── Empty tables: report it, never reseed ────────────────────────────────────


def test_empty_tables_are_reported_and_not_reseeded(db_path, app_module):
    from fastapi.testclient import TestClient

    execute(db_path, "DELETE FROM weekly_observations")
    execute(db_path, "DELETE FROM predictions")

    with TestClient(app_module.app) as client:
        assert client.get("/dataset/previous-week").status_code == 404
        assert client.get("/dataset/observations").json() == []
        summary = client.get("/dataset/summary").json()
        assert summary["total_rows"] == 0
        assert summary["sample_records"] == []
        assert client.get("/predictions").json() == []
        assert client.get("/predictions/latest").status_code == 404

        unified = client.post("/predict-unified", data={"override_jassid": "1.1"})
        assert unified.status_code == 404
        assert "weekly_observations" in unified.json()["detail"]
        assert client.post("/dataset/predict-latest").status_code == 404
        assert client.post("/auto-predict", files=leaf_upload()).status_code == 404

    assert count(db_path, "weekly_observations") == 0
    assert count(db_path, "predictions") == 0


# ── Reads come straight from the database ────────────────────────────────────


def test_dataset_endpoints_match_the_database(client, db_path):
    total = count(db_path, "weekly_observations")
    years = [
        r["report_year"]
        for r in query(db_path, "SELECT DISTINCT report_year FROM weekly_observations ORDER BY report_year")
    ]

    summary = client.get("/dataset/summary").json()
    assert summary["total_rows"] == total
    assert summary["years_covered"] == years
    assert "jassid_per_3_leaves" in summary["columns"]

    observations = client.get("/dataset/observations").json()
    assert len(observations) == total
    expected = latest_observation(db_path)
    assert observations[-1]["id"] == expected["id"]

    latest = client.get("/dataset/previous-week").json()
    assert latest["id"] == expected["id"]
    assert latest["jassid_per_3_leaves"] == expected["jassid_per_3_leaves"]
    assert latest["source"].startswith("Database")


def test_predictions_endpoints_match_the_database(client, db_path):
    rows = query(db_path, "SELECT id FROM predictions ORDER BY id DESC")

    listed = client.get("/predictions?limit=500").json()
    assert [r["id"] for r in listed] == [r["id"] for r in rows]
    assert all(isinstance(r["explanation"], list) for r in listed)

    assert len(client.get("/predictions?limit=2").json()) == min(2, len(rows))
    assert len(client.get("/predictions?limit=0").json()) == min(1, len(rows))
    assert client.get("/predictions/latest").json()["id"] == rows[0]["id"]


# ── Predictions are computed from and written to the database ────────────────


def test_manual_prediction_is_saved(client, db_path):
    before = count(db_path, "predictions")

    res = client.post("/predict", json=MANUAL_INPUT)
    assert res.status_code == 200
    body = res.json()
    assert body["risk"] in ("HIGH", "LOW")
    assert len(body["explanation"]) == 5

    assert count(db_path, "predictions") == before + 1
    saved = client.get("/predictions/latest").json()
    assert saved["image_name"] == "Manual_Input"
    assert saved["prev_week_smw"] is None
    assert saved["detected_jassid"] == MANUAL_INPUT["jassid_per_3_leaves"]
    assert saved["predicted_next_week_jassid"] == body["predicted_next_week_jassid"]


def test_latest_observation_prediction_is_saved(client, db_path):
    before = count(db_path, "predictions")
    observation = latest_observation(db_path)

    res = client.post("/dataset/predict-latest")
    assert res.status_code == 200

    assert count(db_path, "predictions") == before + 1
    saved = client.get("/predictions/latest").json()
    assert saved["image_name"] == "Database_Latest_Week"
    assert saved["weather_source"] == "SQLite weekly_observations"
    assert saved["detected_jassid"] == observation["jassid_per_3_leaves"]
    assert saved["prev_week_smw"] == observation["smw"]
    assert saved["max_temp_c"] == observation["max_temp_c"]
    assert saved["predicted_next_week_jassid"] == res.json()["predicted_next_week_jassid"]


def test_reading_never_creates_a_prediction(client, db_path):
    before = count(db_path, "predictions")

    assert client.get("/dataset/predict-latest").status_code == 405
    client.get("/predictions/latest")
    client.get("/predictions")
    client.get("/dataset/previous-week")

    assert count(db_path, "predictions") == before


def test_unified_prediction_uses_database_lags_and_live_weather(client, db_path):
    before = count(db_path, "predictions")
    observation = latest_observation(db_path)

    res = client.post("/predict-unified", data={"override_jassid": "1.1"})
    assert res.status_code == 200
    body = res.json()
    assert body["vision_analysis"] is None
    assert body["previous_week_data"]["id"] == observation["id"]
    assert body["live_weather"]["source"] == STUB_WEATHER["source"]
    assert "Excel" not in body["prediction"]["model_used"]

    assert count(db_path, "predictions") == before + 1
    saved = query(db_path, "SELECT * FROM predictions WHERE id = ?", (body["db_record"]["id"],))[0]
    assert saved["image_name"] == "Database_Observation"
    assert saved["detected_jassid"] == 1.1
    assert saved["prev_week_smw"] == observation["smw"]
    assert saved["prev_week_jassid_lag_1"] == observation["jassid_per_3_leaves"]
    assert saved["prev_week_jassid_lag_2"] == observation["jassid_lag_1"]
    assert saved["max_temp_c"] == STUB_WEATHER["max_temp_c"]
    assert saved["weather_source"] == STUB_WEATHER["source"]


def test_unified_prediction_from_leaf_photo(client, db_path):
    before = count(db_path, "predictions")

    res = client.post("/predict-unified", files=leaf_upload())
    assert res.status_code == 200
    body = res.json()
    assert body["vision_analysis"]["filename"] == "field_photo.jpg"

    assert count(db_path, "predictions") == before + 1
    saved = client.get("/predictions/latest").json()
    assert saved["image_name"] == "field_photo.jpg"
    assert saved["detected_jassid"] == body["vision_analysis"]["jassid_per_3_leaves"]


def test_auto_predict_reads_lags_from_the_database(client, db_path):
    before = count(db_path, "predictions")
    observation = latest_observation(db_path)

    res = client.post("/auto-predict", files=leaf_upload())
    assert res.status_code == 200
    assert res.json()["vision_analysis"] is not None

    assert count(db_path, "predictions") == before + 1
    saved = client.get("/predictions/latest").json()
    assert saved["prev_week_jassid_lag_1"] == observation["jassid_per_3_leaves"]
    assert saved["prev_week_jassid_lag_2"] == observation["jassid_lag_1"]


def test_unified_prediction_requires_a_photo_or_count(client, db_path):
    before = count(db_path, "predictions")

    assert client.post("/predict-unified").status_code == 400

    assert count(db_path, "predictions") == before


def test_null_model_column_is_reported_not_substituted(client, db_path):
    before = count(db_path, "predictions")
    observation = latest_observation(db_path)
    execute(db_path, "UPDATE weekly_observations SET max_temp_c = NULL WHERE id = ?", (observation["id"],))

    for res in (
        client.post("/predict-unified", data={"override_jassid": "1.1"}),
        client.post("/dataset/predict-latest"),
    ):
        assert res.status_code == 422
        assert "max_temp_c" in res.json()["detail"]

    assert count(db_path, "predictions") == before


# ── Error handling ───────────────────────────────────────────────────────────

BROWSER = {"Origin": "http://localhost:3000"}


def test_weather_outage_is_a_503_and_saves_nothing(client, db_path, app_module, monkeypatch):
    def outage():
        raise RuntimeError("Live Open-Meteo weather is unavailable")

    monkeypatch.setattr(app_module, "fetch_coimbatore_weather", outage)
    before = count(db_path, "predictions")

    weather = client.get("/weather/coimbatore", headers=BROWSER)
    assert weather.status_code == 503
    assert "weather" in weather.json()["detail"].lower()
    # The browser can only read the error body when the CORS header is present.
    assert weather.headers["access-control-allow-origin"] == BROWSER["Origin"]

    assert client.post("/predict-unified", data={"override_jassid": "1.1"}).status_code == 503
    assert count(db_path, "predictions") == before


def test_missing_database_is_a_503_and_is_not_created(tmp_path, monkeypatch, app_module):
    from fastapi.testclient import TestClient

    missing = tmp_path / "missing.db"
    monkeypatch.setenv("PROCROP_DB_PATH", str(missing))

    with TestClient(app_module.app) as client:
        for res in (
            client.get("/dataset/summary", headers=BROWSER),
            client.get("/predictions", headers=BROWSER),
            client.post("/predict-unified", data={"override_jassid": "1.1"}, headers=BROWSER),
            client.post("/auth/login", json={"email": "a@b.co", "password": "password1"}, headers=BROWSER),
        ):
            assert res.status_code == 503
            assert res.json()["detail"].startswith("Database error")
            assert res.headers["access-control-allow-origin"] == BROWSER["Origin"]

    assert not missing.exists()


# ── Accounts are rows of the users table ─────────────────────────────────────

ACCOUNT = {"name": "  Meena Kumar ", "email": "Meena@Example.org", "password": "cotton-field-9"}


def register(client, **overrides):
    return client.post("/auth/register", json={**ACCOUNT, **overrides})


def bearer(token):
    return {"Authorization": f"Bearer {token}"}


def test_register_writes_a_hashed_user_row(client, db_path):
    before = count(db_path, "users")

    res = register(client)
    assert res.status_code == 201
    body = res.json()
    assert body["user"]["name"] == "Meena Kumar"
    assert body["user"]["email"] == "meena@example.org"
    assert "password_hash" not in body["user"]

    assert count(db_path, "users") == before + 1
    row = query(db_path, "SELECT * FROM users WHERE id = ?", (body["user"]["id"],))[0]
    assert row["email"] == "meena@example.org"
    assert row["password_hash"].startswith("pbkdf2_sha256$")
    assert ACCOUNT["password"] not in row["password_hash"]


def test_register_rejects_duplicates_and_bad_input(client, db_path):
    assert register(client).status_code == 201
    users = count(db_path, "users")

    duplicate = register(client, email="MEENA@example.org", name="Someone Else")
    assert duplicate.status_code == 409
    assert "already exists" in duplicate.json()["detail"]

    assert register(client, email="short@example.org", password="short").status_code == 422
    assert register(client, email="not-an-email").status_code == 422
    assert register(client, email="blank@example.org", name="   ").status_code == 422

    assert count(db_path, "users") == users


def test_login_checks_the_stored_password(client):
    register(client)

    ok = client.post("/auth/login", json={"email": "meena@example.org", "password": ACCOUNT["password"]})
    assert ok.status_code == 200
    assert ok.json()["user"]["email"] == "meena@example.org"

    wrong = client.post("/auth/login", json={"email": "meena@example.org", "password": "wrong-password"})
    assert wrong.status_code == 401

    unknown = client.post("/auth/login", json={"email": "nobody@example.org", "password": ACCOUNT["password"]})
    assert unknown.status_code == 401
    assert unknown.json()["detail"] == wrong.json()["detail"]


def test_profile_requires_a_valid_token(client):
    token = register(client).json()["token"]

    assert client.get("/auth/me").status_code == 401
    assert client.get("/auth/me", headers=bearer(token[:-2] + "xx")).status_code == 401
    assert client.get("/auth/me", headers=bearer("not-a-token")).status_code == 401

    me = client.get("/auth/me", headers=bearer(token))
    assert me.status_code == 200
    assert me.json()["name"] == "Meena Kumar"
    assert me.json()["created_at"]


def test_profile_update_changes_the_user_row(client, db_path):
    auth = register(client).json()
    other = register(client, email="other@example.org", name="Other User").json()

    res = client.put(
        "/auth/me", json={"name": "Meena K", "email": "Meena.K@example.org"}, headers=bearer(auth["token"])
    )
    assert res.status_code == 200
    assert res.json() == {**auth["user"], "name": "Meena K", "email": "meena.k@example.org"}

    row = query(db_path, "SELECT name, email FROM users WHERE id = ?", (auth["user"]["id"],))[0]
    assert row == {"name": "Meena K", "email": "meena.k@example.org"}
    assert client.get("/auth/me", headers=bearer(auth["token"])).json()["name"] == "Meena K"

    taken = client.put(
        "/auth/me", json={"name": "Meena K", "email": other["user"]["email"]}, headers=bearer(auth["token"])
    )
    assert taken.status_code == 409
    assert client.put("/auth/me", json={"name": "X", "email": "x@example.org"}).status_code == 401


@pytest.mark.parametrize("table", ["weekly_observations", "predictions", "users"])
def test_schema_is_unchanged_after_startup(client, db_path, table):
    from conftest import REAL_DB

    def columns(path):
        return [(r["name"], r["type"], r["notnull"], r["pk"]) for r in query(path, f"PRAGMA table_info({table})")]

    assert columns(db_path) == columns(REAL_DB)
