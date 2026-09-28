from datetime import date, timedelta
from app.services.validation import validate_observation

def test_duplicate_observation_rejection():
    fare_data = {
        "base_fare_inr": 3000.0,
        "taxes_fees_inr": 800.0,
        "convenience_fee_inr": 0.0,
        "total_payable_inr": 3800.0,
        "currency": "INR",
        "availability_status": "available"
    }
    today = date.today()
    status, flags = validate_observation(
        fare_data=fare_data,
        origin_iata="DEL",
        dest_iata="BOM",
        travel_date=today + timedelta(days=30),
        booking_lead_time_days=30,
        collection_date=today,
        is_duplicate=True
    )
    assert status == "rejected"
    assert "DUPLICATE_OBSERVATION" in flags
