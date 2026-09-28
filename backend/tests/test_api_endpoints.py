from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Does not replace CPI" in data["disclaimer"]

def test_meta_endpoint():
    response = client.get("/api/v1/meta")
    assert response.status_code == 200
    data = response.json()
    assert "booking_windows" in data
    assert data["booking_windows"] == [1, 7, 15, 30, 45]
    assert "methodology_version" in data
