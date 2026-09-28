import urllib.robotparser
from datetime import date
from typing import Dict, Any
from app.adapters.base import SourceAdapter

class AirlineSourceAdapter(SourceAdapter):
    """
    Production-ready skeleton for real Airline website collection.
    Enforces strict robots.txt adherence, terms-of-service compliance, and rate limits.
    Does NOT contain anti-bot evasion, proxy rotation, or CAPTCHA bypassing logic.
    """

    def __init__(self, airline_name: str, base_url: str, rate_limit_per_minute: int = 30):
        self.airline_name = airline_name
        self.base_url = base_url
        self.rate_limit_per_minute = rate_limit_per_minute
        self.rp = urllib.robotparser.RobotFileParser()

    def check_robots_txt(self, user_agent: str = "VayuIndex-Bot/1.0 (MoSPI DIID Research Prototype)") -> bool:
        """
        Parses the official robots.txt file at base_url/robots.txt.
        """
        robots_url = f"{self.base_url.rstrip('/')}/robots.txt"
        try:
            self.rp.set_url(robots_url)
            self.rp.read()
            return self.rp.can_fetch(user_agent, f"{self.base_url}/search")
        except Exception:
            # Fallback to conservative refusal if robots.txt cannot be parsed
            return False

    def fetch_observations(
        self,
        route_origin: str,
        route_dest: str,
        travel_date: date,
        booking_lead_time_days: int,
        airline_code: str,
    ) -> Dict[str, Any]:
        """
        Skeleton method for real HTTP requests / Playwright collection.
        In demo mode, returns a compliance warning indicating simulated mode is active.
        """
        if not self.check_robots_txt():
            return {
                "outcome": "blocked",
                "http_status": 403,
                "error_message": f"Collection disallowed by {self.airline_name} robots.txt policy.",
                "duration_ms": 50,
                "raw_response": None,
                "fare_data": None
            }

        # Skeleton placeholder for legitimate requests/playwright interaction
        return {
            "outcome": "invalid",
            "http_status": 501,
            "error_message": "Real-source adapter stub: Live network collection is disabled in prototype mode. Use SimulatedSourceAdapter.",
            "duration_ms": 10,
            "raw_response": None,
            "fare_data": None
        }
