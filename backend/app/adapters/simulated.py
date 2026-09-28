import hashlib
import json
import math
from datetime import date, datetime
from typing import Dict, Any
from app.adapters.base import SourceAdapter

class SimulatedSourceAdapter(SourceAdapter):
    """
    Deterministic simulated source adapter for VayuIndex prototype demonstration.
    Generates realistic airfare observations without contacting external websites.
    """

    def __init__(self, source_name: str, source_type: str = "simulated", anomaly_rate: float = 0.03):
        self.source_name = source_name
        self.source_type = source_type
        self.anomaly_rate = anomaly_rate

    def check_robots_txt(self, base_url: str) -> bool:
        # Simulated source always complies
        return True

    def fetch_observations(
        self,
        route_origin: str,
        route_dest: str,
        travel_date: date,
        booking_lead_time_days: int,
        airline_code: str,
        collection_date: date = None
    ) -> Dict[str, Any]:
        """
        Generates deterministic fare observations based on route, airline, lead time, and collection date.
        """
        if collection_date is None:
            collection_date = date.today()

        # Deterministic seed string
        seed_str = f"{self.source_name}:{route_origin}-{route_dest}:{airline_code}:{travel_date.isoformat()}:T+{booking_lead_time_days}:{collection_date.isoformat()}"
        hash_val = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)
        
        # Check for simulated collection anomalies (e.g., 3% chance if enabled)
        anomaly_roll = (hash_val % 1000) / 1000.0
        
        if anomaly_roll < 0.005:
            return {
                "outcome": "blocked",
                "http_status": 403,
                "error_message": "403 Forbidden - Simulated rate limit or bot detection trigger",
                "duration_ms": 120,
                "raw_response": None,
                "fare_data": None
            }
        elif anomaly_roll < 0.010:
            return {
                "outcome": "timeout",
                "http_status": 504,
                "error_message": "504 Gateway Timeout - Gateway response timeout after 5000ms",
                "duration_ms": 5000,
                "raw_response": None,
                "fare_data": None
            }
        elif anomaly_roll < 0.015:
            return {
                "outcome": "schema_change",
                "http_status": 200,
                "error_message": "SchemaFingerprintMismatch: Unexpected payload structural change",
                "duration_ms": 250,
                "raw_response": json.dumps({"unrecognized_root": "broken_structure"}),
                "fare_data": None
            }
        elif anomaly_roll < 0.025:
            return {
                "outcome": "sold_out",
                "http_status": 200,
                "error_message": "Flight fully booked / sold out",
                "duration_ms": 180,
                "raw_response": json.dumps({"status": "SOLD_OUT", "route": f"{route_origin}-{route_dest}"}),
                "fare_data": {
                    "availability_status": "sold_out",
                    "base_fare_inr": 0.0,
                    "taxes_fees_inr": 0.0,
                    "convenience_fee_inr": 0.0,
                    "optional_ancillaries_inr": 0.0,
                    "total_payable_inr": 0.0,
                    "currency": "INR"
                }
            }
        elif anomaly_roll < 0.030:
            # Implausibly low/invalid fare anomaly to test validation logic
            return {
                "outcome": "invalid",
                "http_status": 200,
                "error_message": "Parsed fare failed baseline sanity check",
                "duration_ms": 150,
                "raw_response": json.dumps({"fare": -150}),
                "fare_data": {
                    "availability_status": "available",
                    "base_fare_inr": -150.0,
                    "taxes_fees_inr": 0.0,
                    "convenience_fee_inr": 0.0,
                    "optional_ancillaries_inr": 0.0,
                    "total_payable_inr": -150.0,
                    "currency": "INR"
                }
            }

        # Successful deterministic fare generation
        # 1. Base route distance baseline
        route_key = f"{route_origin}-{route_dest}"
        route_baselines = {
            "DEL-BOM": 5200.0,
            "DEL-BLR": 5800.0,
            "BOM-BLR": 4300.0,
            "DEL-CCU": 4900.0,
            "BLR-HYD": 3200.0,
            "MAA-DEL": 5600.0,
            "DEL-HYD": 4500.0,
            "BOM-CCU": 5400.0,
            "BLR-MAA": 2900.0,
            "DEL-GOI": 5100.0
        }
        base_route_price = route_baselines.get(route_key, 4800.0)

        # 2. Advance purchase lead-time multiplier (T+1 highest, T+45 lowest)
        lead_time_multipliers = {
            1: 1.78,
            7: 1.35,
            15: 1.12,
            30: 1.00,
            45: 0.91
        }
        lead_mult = lead_time_multipliers.get(booking_lead_time_days, 1.0)

        # 3. Airline tier multiplier
        airline_multipliers = {
            "AI": 1.08,    # Air India (full service)
            "6E": 1.00,    # IndiGo (LCC market leader)
            "QP": 0.96,    # Akasa Air
            "SG": 0.94,    # SpiceJet
            "IX": 0.93     # Air India Express
        }
        airline_mult = airline_multipliers.get(airline_code, 1.0)

        # 4. Source variation (OTAs have convenience fees)
        is_ota = "OTA" in self.source_name.upper() or "CLEARTRIP" in self.source_name.upper() or "MAKEMYTRIP" in self.source_name.upper()
        source_var = 1.02 if is_ota else 1.00

        # 5. Day of week & Macro trend
        # Friday (4) and Sunday (6) are higher
        weekday = travel_date.weekday()
        day_mult = 1.14 if weekday in (4, 6) else (1.06 if weekday == 5 else 0.98)

        # 6. Seasonal / Macro sine wave over days
        day_of_year = travel_date.timetuple().tm_yday
        macro_wave = 1.0 + 0.08 * math.sin(day_of_year / 15.0)

        # 7. Deterministic noise (-4% to +4%)
        noise = 1.0 + (((hash_val % 80) - 40) / 1000.0)

        raw_total = base_route_price * lead_mult * airline_mult * source_var * day_mult * macro_wave * noise
        total_payable = round(raw_total, 2)

        # Component breakdown
        convenience_fee = 350.0 if is_ota else 0.0
        base_fare = round((total_payable - convenience_fee) * 0.72, 2)
        taxes_fees = round(total_payable - base_fare - convenience_fee, 2)
        optional_ancillaries = round(450.0 if (hash_val % 2 == 0) else 0.0, 2)

        raw_body_struct = {
            "source": self.source_name,
            "origin": route_origin,
            "destination": route_dest,
            "travel_date": travel_date.isoformat(),
            "lead_time": booking_lead_time_days,
            "airline": airline_code,
            "fare": {
                "base": base_fare,
                "taxes": taxes_fees,
                "convenience_fee": convenience_fee,
                "ancillaries": optional_ancillaries,
                "total": total_payable,
                "currency": "INR"
            },
            "status": "CONFIRMED_AVAILABLE"
        }

        return {
            "outcome": "success",
            "http_status": 200,
            "error_message": None,
            "duration_ms": 140 + (hash_val % 100),
            "raw_response": json.dumps(raw_body_struct, indent=2),
            "fare_data": {
                "availability_status": "available",
                "base_fare_inr": base_fare,
                "taxes_fees_inr": taxes_fees,
                "convenience_fee_inr": convenience_fee,
                "optional_ancillaries_inr": optional_ancillaries,
                "total_payable_inr": total_payable,
                "currency": "INR",
                "parser_version": "v1.0"
            }
        }
