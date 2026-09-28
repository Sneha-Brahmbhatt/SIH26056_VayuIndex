from datetime import date, timedelta
from app.services.validation import validate_observation

def test_fare_component_sum_mismatch():
    # Base + Taxes + Convenience != Total
    fare_data = {
        "base_fare_inr": 3000.0,
        "taxes_fees_inr": 1000.0,
        "convenience_fee_inr": 200.0,
        "total_payable_inr": 5000.0, # sum is 4200, mismatch!
        "currency": "INR",
        "availability_status": "available"
    }
    today = date.today()
    status, flags = validate_observation(
        fare_data=fare_data,
        origin_iata="DEL",
        dest_iata="BOM",
        travel_date=today + timedelta(days=15),
        booking_lead_time_days=15,
        collection_date=today
    )
    assert status == "quarantined"
    assert any("SUM_MISMATCH" in f for f in flags)
