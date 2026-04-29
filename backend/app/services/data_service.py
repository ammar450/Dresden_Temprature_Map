import json
from typing import Optional

from app.core.config import settings
from app.models.sensor import SensorFeature


class DataService:

    def __init__(self) -> None:
        self._features: list[SensorFeature] = []
        self._load()

    def _load(self) -> None:
        with open(settings.DATA_FILE, "r", encoding="utf-8") as f:
            raw = json.load(f)

        feature_list = raw.get("features", raw) if isinstance(raw, dict) else raw
        self._features = [SensorFeature(**feat) for feat in feature_list]

    def get_features(
        self,
        time: Optional[str] = None,
        network: Optional[str] = None,
        bbox: Optional[str] = None,
    ) -> list[SensorFeature]:
        results = self._features

        if time:
            results = [f for f in results if f.properties.time == time]

        if network:
            results = [
                f for f in results
                if f.properties.network.lower() == network.lower()
            ]

        if bbox:
            parts = [float(x) for x in bbox.split(",")]
            if len(parts) != 4:
                raise ValueError(
                    "bbox must be four comma-separated numbers: min_lon,min_lat,max_lon,max_lat"
                )
            min_lon, min_lat, max_lon, max_lat = parts
            results = [
                f for f in results
                if min_lon <= f.geometry.coordinates[0] <= max_lon
                and min_lat <= f.geometry.coordinates[1] <= max_lat
            ]

        return results

    def get_times(self) -> list[str]:
        return sorted({f.properties.time for f in self._features})

    def get_networks(self) -> list[str]:
        return sorted({f.properties.network for f in self._features})


data_service = DataService()
