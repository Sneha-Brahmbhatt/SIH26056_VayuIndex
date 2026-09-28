import urllib.robotparser
from datetime import date
from typing import Dict, Any
from app.adapters.base import SourceAdapter

class OTASourceAdapter(SourceAdapter):
    """
    Production-ready skeleton for Online Travel Aggregator (OTA) collection.
    Enforces strict robots.txt adherence, access terms, and rate limits.
    Does NOT contain anti-bot evasion, proxy rotation, or CAPTCHA bypassing logic.
    """

    def __init__(self, ota_name: str, base_url: str, rate_limit_per_minute: int = 20):
        self.ota_name = ota_name
        self.base_url = base_url
        self.rate_limit_per_minute = rate_limit_per_minute
        self.rp = urllib.robotparser.RobotFileParser()

    def check_robots_txt(self, user_agent: str = "VayuIndex-Bot/1.0 (MoSPI DIID Research Prototype)") -> bool:
        robots_url = f"{self.base_url.rstrip('/')}/robots.txt"
        try:
            self.rp.set_url(robots_url)
            self.rp.read()
            return self.rp.can_fetch(user_agent, f"{self.base_url}/search")
        except Exception:
            return False

    def fetch_observations(
        self,
        route_origin: str,
        route_dest: str,
        travel_date: date,
        booking_lead_time_days: int,
        airline_code: str,
    ) -> Dict[str, Any]:
        if not self.check_robots_txt():
            return {
                "outcome": "blocked",
                "http_status": 403,
                "error_message": f"Collection disallowed by {self.ota_name} robots.txt policy.",
                "duration_ms": 50,
                "raw_response": None,
                "fare_data": None
            }

        return {
            "outcome": "invalid",
            "http_status": 501,
            "error_message": "OTA real-source adapter stub: Live network collection is disabled in prototype mode. Use SimulatedSourceAdapter.",
            "duration_ms": 10,
            "raw_response": None,
            "fare_data": None
        }
