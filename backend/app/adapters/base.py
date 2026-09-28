from abc import ABC, abstractmethod
from datetime import date
from typing import Dict, Any, List

class SourceAdapter(ABC):
    """
    Abstract interface for airfare data collection adapters.
    All real and simulated adapters must inherit from this base class.
    """

    @abstractmethod
    def fetch_observations(
        self,
        route_origin: str,
        route_dest: str,
        travel_date: date,
        booking_lead_time_days: int,
        airline_code: str,
    ) -> Dict[str, Any]:
        """
        Fetches raw airfare observations for a given route, travel date, lead time and carrier.
        Returns a dict containing raw response data, metadata, status, and raw fare items.
        """
        pass

    @abstractmethod
    def check_robots_txt(self, base_url: str) -> bool:
        """
        Checks if collection is permitted under robots.txt.
        Must return True if allowed, False if disallowed.
        """
        pass
