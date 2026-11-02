import pytest
import httpx
from backend.app import app

@pytest.mark.asyncio
async def test_health_endpoint():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

@pytest.mark.asyncio
async def test_config_endpoint():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/config")
        assert response.status_code == 200
        config = response.json()
        
        # Check upload constraints
        assert "upload" in config
        assert config["upload"]["min_images"] == 5
        assert config["upload"]["target_images"] == 15
        assert config["upload"]["max_images"] == 30
        assert config["upload"]["max_image_mb"] == 8
        
        # Check ETL
        assert "economic_threshold_level" in config
        etl = config["economic_threshold_level"]
        assert etl["jassids_per_leaf"] == 2.0
        assert etl["jassids_per_3_leaves"] == 6.0
        assert "ICAR" in etl["source"] or "TNAU" in etl["source"]
        
        # Check risk classes
        assert "risk_classes" in config
        assert "low" in config["risk_classes"]
        assert "medium" in config["risk_classes"]
        assert "high" in config["risk_classes"]
