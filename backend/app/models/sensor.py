from typing import Optional
from pydantic import BaseModel


class PointGeometry(BaseModel):
    type: str = "Point"
    coordinates: list[float]


class SensorProperties(BaseModel):
    time: str
    v: Optional[float] = None
    id: str
    hi: Optional[float] = None
    lo: Optional[float] = None
    c: float
    uom: str
    network: str
    description: str
    name: str


class SensorFeature(BaseModel):
    type: str = "Feature"
    geometry: PointGeometry
    properties: SensorProperties


class FeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: list[SensorFeature]
    count: int
