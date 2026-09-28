from datetime import date, timedelta
from app.services.validation import validate_observation

def test_valid_observation():
    fare_data = {
        "base_fare_inr": 3500.0,
        "taxes_fees_inr": 1000.0,
        "convenience_fee_inr": 350.0,
        "total_payable_inr": 4850.0,
        "currency": "INR",
        "availability_status": "available"
    }
    today = date.today()
    travel_date = today + timedelta(days=7)

    status, flags = validate_observation(
        fare_data=fare_data,
        origin_iata="DEL",
        dest_iata="BOM",
        travel_date=travel_date,
        booking_lead_time_days=7,
        collection_date=today,
        is_duplicate=False
    )
    assert status == "accepted"
    assert flags == []

def test_negative_fare_rejection():
    fare_data = {
        "base_fare_inr": -500.0,
        "taxes_fees_inr": 0.0,
        "convenience_fee_inr": 0.0,
        "total_payable_inr": -500.0,
        "currency": "INR",
        "availability_status": "available"
    }
    today = date.today()
    status, flags = validate_observation(
        fare_data=fare_data,
        origin_iata="DEL",
        dest_iata="BOM",
        travel_date=today + timedelta(days=1),
        booking_lead_time_days=1,
        collection_date=today
    )
    assert status == "rejected"
    assert "NON_POSITIVE_TOTAL_FARE" in flags

def test_past_travel_date_rejection():
    fare_data = {
        "base_fare_inr": 3000.0,
        "taxes_fees_inr": 800.0,
        "convenience_fee_inr": 0.0,
        "total_payable_inr": 3800.0,
        "currency": "INR",
        "availability_status": "available"
    }
    today = date.today()
    past_date = today - timedelta(days=2)

    status, flags = validate_observation(
        fare_data=fare_data,
        origin_iata="DEL",
        dest_iata="BOM",
        travel_date=past_date,
        booking_lead_time_days=7,
        collection_date=today
    )
    assert status == "rejected"
    assert "PAST_TRAVEL_DATE" in flags
