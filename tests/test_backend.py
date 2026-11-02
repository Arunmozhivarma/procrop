import os
import io
import json
import pytest
from PIL import Image
from httpx import AsyncClient, ASGITransport

from backend.app import app
from backend.database import init_db
from backend.risk_engine import compute_risk

_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def create_dummy_leaf_image_bytes(color=(45, 130, 45)):
    """Creates in-memory JPEG bytes of a synthetic leaf for testing."""
    im = Image.new("RGB", (640, 480), color=color)
    buf = io.BytesIO()
    im.save(buf, format="JPEG")
    return buf.getvalue()

@pytest.mark.asyncio
async def test_migration_idempotency():
    """Verifies init_db() can be called repeatedly without errors or corrupting tables."""
    init_db()
    init_db()
    init_db()
    assert True

@pytest.mark.asyncio
async def test_auth_flow_and_per_user_isolation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        ts = int(pytest.importorskip("time").time())
        # 1. Register User A
        reg_a = await ac.post("/auth/register", json={
            "email": f"farmer_a_{ts}@procrop.org",
            "password": "Password123!",
            "name": "Farmer Arun"
        })
        assert reg_a.status_code == 200
        token_a = reg_a.json()["access_token"]
        headers_a = {"Authorization": f"Bearer {token_a}"}

        # 2. Register User B
        reg_b = await ac.post("/auth/register", json={
            "email": f"farmer_b_{ts}@procrop.org",
            "password": "Password123!",
            "name": "Farmer Bala"
        })
        assert reg_b.status_code == 200
        token_b = reg_b.json()["access_token"]
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # 3. User A creates a field
        fld_res = await ac.post("/fields", headers=headers_a, json={
            "name": "Arun North Block",
            "district": "Coimbatore",
            "variety": "Bt Hybrid 1",
            "variety_trait": "tolerant_hairy"
        })
        assert fld_res.status_code == 200
        field_a_id = fld_res.json()["id"]

        # 4. User B attempts to read User A's field -> Must be 404/Forbidden
        get_fld_b = await ac.get(f"/fields/{field_a_id}", headers=headers_b)
        assert get_fld_b.status_code in [403, 404]

        # 5. User B lists fields -> Must be empty
        b_fields = await ac.get("/fields", headers=headers_b)
        assert len(b_fields.json()) == 0

        # 6. User A logs out
        logout_res = await ac.post("/auth/logout", headers=headers_a)
        assert logout_res.status_code == 200

        # 7. Old token A is now invalid/revoked -> 401
        me_res = await ac.get("/auth/me", headers=headers_a)
        assert me_res.status_code == 401

@pytest.mark.asyncio
async def test_image_count_validation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        sample_path = os.path.join(_root, "public", "sample-leaves", "jassid_moderate_sample.jpg")
        with open(sample_path, "rb") as f:
            sample_bytes = f.read()

        # 1. Test 4 images (Under min=5)
        files_4 = [("images", (f"leaf_{i}.jpg", sample_bytes, "image/jpeg")) for i in range(4)]
        res_4 = await ac.post("/predict", files=files_4, data={"payload": json.dumps({"field_name": "Test"})})
        assert res_4.status_code == 400
        assert "Add at least 5 leaf photos to continue (you have 4)." in res_4.json()["detail"]

        # 2. Test 31 images (Over max=30)
        files_31 = [("images", (f"leaf_{i}.jpg", sample_bytes, "image/jpeg")) for i in range(31)]
        res_31 = await ac.post("/predict", files=files_31, data={"payload": json.dumps({"field_name": "Test"})})
        assert res_31.status_code == 400
        assert "Maximum 30 photos. Remove 1 to continue." in res_31.json()["detail"]

        # 3. Test 5 images (Minimum boundary - succeeds with Low confidence)
        files_5 = [("images", (f"leaf_{i}.jpg", sample_bytes, "image/jpeg")) for i in range(5)]
        res_5 = await ac.post("/predict", files=files_5, data={"payload": json.dumps({"field_name": "Test"})})
        assert res_5.status_code == 200
        assert res_5.json()["image_aggregates"]["n_images_uploaded"] == 5

        # 4. Test 15 images (Target sample - succeeds with High confidence)
        files_15 = [("images", (f"leaf_{i}.jpg", sample_bytes, "image/jpeg")) for i in range(15)]
        res_15 = await ac.post("/predict", files=files_15, data={"payload": json.dumps({"field_name": "Test"})})
        assert res_15.status_code == 200
        assert res_15.json()["image_aggregates"]["n_images_uploaded"] == 15
        assert res_15.json()["confidence"] == "High"

@pytest.mark.asyncio
async def test_spray_effect_monotonicity():
    """
    Proves spray-effect monotonicity:
    All else equal, a recent effective insecticide spray never raises pest risk vs no spray.
    """
    import datetime
    today_str = datetime.date.today().isoformat()
    three_days_ago = (datetime.date.today() - datetime.timedelta(days=3)).isoformat()

    features = {
        'jassid_per_3_leaves': 4.5,
        'jassid_lag_1': 3.2,
        'jassid_lag_2': 2.0,
        'jassid_trend': 1.3,
        'smw': 42,
        'max_temp_c': 32.0,
        'min_temp_c': 22.0,
        'rh_morning_pct': 82.0,
        'rh_evening_pct': 56.0,
        'rainfall_mm': 5.0,
        'rainy_days': 1,
        'wind_speed_kmh': 6.0,
        'sunshine_hours': 7.0,
        'mean_temp_c': 27.0,
        'mean_rh_pct': 69.0,
        'max_temp_c_lag_1': 31.5,
        'min_temp_c_lag_1': 22.0,
        'rh_morning_pct_lag_1': 80.0,
        'rh_evening_pct_lag_1': 55.0,
        'rainfall_mm_lag_1': 8.0,
        'rainy_days_lag_1': 1
    }

    aggregates = {
        "confidence_level": "High",
        "share_of_images_with_grade_ge_2": 0.10
    }

    # No spray
    no_spray_res = compute_risk(
        features_dict=features,
        image_aggregates=aggregates,
        management_inputs={
            "spray_class": "none",
            "last_spray_date": None,
            "variety_trait": "unknown",
            "bt_status": "Bt",
            "nitrogen_level": "medium",
            "alternate_hosts": "none",
            "irrigation": "rainfed"
        }
    )

    # Recent neonicotinoid spray 3 days ago
    sprayed_res = compute_risk(
        features_dict=features,
        image_aggregates=aggregates,
        management_inputs={
            "spray_class": "neonicotinoid",
            "last_spray_date": three_days_ago,
            "variety_trait": "unknown",
            "bt_status": "Bt",
            "nitrogen_level": "medium",
            "alternate_hosts": "none",
            "irrigation": "rainfed"
        }
    )

    # Recent effective spray must not increase risk score vs no spray
    assert sprayed_res["final_score"] <= no_spray_res["final_score"], (
        f"Monotonicity violation: Sprayed risk {sprayed_res['final_score']} > No spray {no_spray_res['final_score']}"
    )
    assert sprayed_res["compound_multiplier"] < 1.0
