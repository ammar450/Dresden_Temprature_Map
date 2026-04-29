from fastapi import APIRouter, Query, HTTPException
from typing import Optional

from app.models.sensor import FeatureCollection
from app.services.data_service import data_service

router = APIRouter(prefix="/sensors", tags=["sensors"])


@router.get("", response_model=FeatureCollection)
def get_sensors(
    time: Optional[str] = Query(None),
    network: Optional[str] = Query(None),
    bbox: Optional[str] = Query(None, description="min_lon,min_lat,max_lon,max_lat"),
):
    try:
        features = data_service.get_features(time=time, network=network, bbox=bbox)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    return FeatureCollection(
        type="FeatureCollection",
        features=features,
        count=len(features),
    )


@router.get("/times")
def get_times():
    return {"times": data_service.get_times()}


@router.get("/networks")
def get_networks():
    return {"networks": data_service.get_networks()}
