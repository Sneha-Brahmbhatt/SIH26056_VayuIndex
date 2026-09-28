from datetime import date
from typing import Dict, Any, List, Tuple
from app.config import settings

def validate_observation(
    fare_data: Dict[str, Any],
    origin_iata: str,
    dest_iata: str,
    travel_date: date,
    booking_lead_time_days: int,
    collection_date: date,
    is_duplicate: bool = False
) -> Tuple[str, List[str]]:
    """
    Validates a raw fare observation against domain rules.
    Returns (quality_status, quality_flags).
    quality_status: 'accepted' | 'quarantined' | 'rejected'
    """
    flags = []

    if is_duplicate:
        flags.append("DUPLICATE_OBSERVATION")
        return "rejected", flags

    if fare_data is None:
        flags.append("NULL_FARE_DATA")
        return "rejected", flags

    total_payable = fare_data.get("total_payable_inr", 0.0)
    base_fare = fare_data.get("base_fare_inr", 0.0)
    taxes = fare_data.get("taxes_fees_inr", 0.0)
    convenience = fare_data.get("convenience_fee_inr", 0.0)
    currency = fare_data.get("currency", "INR")
    availability = fare_data.get("availability_status", "available")

    # Hard Rejections
    if total_payable <= 0 and availability == "available":
        flags.append("NON_POSITIVE_TOTAL_FARE")
        return "rejected", flags

    if currency != "INR":
        flags.append("INVALID_CURRENCY")
        return "rejected", flags

    if origin_iata == dest_iata:
        flags.append("SAME_ORIGIN_DESTINATION")
        return "rejected", flags

    if travel_date < collection_date:
        flags.append("PAST_TRAVEL_DATE")
        return "rejected", flags

    if booking_lead_time_days not in settings.LEAD_TIMES:
        flags.append("UNSUPPORTED_LEAD_TIME")
        return "rejected", flags

    # Quarantines
    # Arithmetic sum validation
    sum_calculated = round(base_fare + taxes + convenience, 2)
    sum_expected = round(total_payable, 2)
    if abs(sum_calculated - sum_expected) > 0.05 and availability == "available":
        flags.append(f"SUM_MISMATCH: calculated {sum_calculated} vs declared {sum_expected}")
        return "quarantined", flags

    # Bounded sanity range for Indian domestic flights (INR 800 - 50,000)
    if (total_payable < 800.0 or total_payable > 50000.0) and availability == "available":
        flags.append(f"IMPLAUSIBLE_FARE_BOUNDS: INR {total_payable}")
        return "quarantined", flags

    if flags:
        return "quarantined", flags

    return "accepted", []
