import os
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app import app

_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

@pytest.mark.asyncio
async def test_model_info_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/model-info")
        assert response.status_code == 200
        data = response.json()

        # Assert key sections exist
        assert "detector_metrics" in data
        assert "hopper_burn_metrics" in data
        assert "risk_metrics" in data
        assert "app_config" in data
        assert "datasets" in data
        assert "limitations" in data
        assert "file_map" in data

        # Check detector metrics
        det = data["detector_metrics"]
        assert det.get("model_architecture") == "YOLOv8n (ultralytics)"
        assert "held_out_test_metrics" in det
        assert "count_mae_per_image" in det["held_out_test_metrics"]

        # Check risk metrics
        risk = data["risk_metrics"]
        assert risk.get("validation_method") == "Leave-One-Season-Out Cross-Validation (LOSOCV, 4 folds)"
        assert "regression_models_losocv" in risk
        assert "persistence_baseline" in risk["regression_models_losocv"]

        # Assert every listed file in file_map actually exists on disk
        for item in data["file_map"]:
            full_path = os.path.join(_root, item["path"])
            assert os.path.exists(full_path), f"File {item['path']} listed in model-info file_map does not exist!"
