"""Live sensor feed router."""
from fastapi import APIRouter
from services.sensor_service import get_latest_readings, get_sensor_map

router = APIRouter()


@router.get("/latest")
def latest():
    """Most-recent reading from every active sensor node."""
    return get_latest_readings()


@router.get("/map")
def sensor_map():
    """Geo-coordinates and metadata for all campus sensor nodes."""
    return get_sensor_map()
