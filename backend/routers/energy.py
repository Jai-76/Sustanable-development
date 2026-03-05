"""Energy & Water router."""
from fastapi import APIRouter, Query
from services.energy_service import (
    get_dashboard_summary,
    get_building_timeseries,
    get_nudges,
    get_anomalies,
    get_forecast,
)

router = APIRouter()


@router.get("/summary")
def summary():
    """Campus-wide energy & water summary for the current day."""
    return get_dashboard_summary()


@router.get("/timeseries/{building_id}")
def timeseries(building_id: str, metric: str = "electricity", hours: int = 24):
    """15-minute resolution consumption data for a specific building."""
    return get_building_timeseries(building_id, metric, hours)


@router.get("/nudges/{building_id}")
def nudges(building_id: str):
    """Top-3 actionable recommendations to reduce consumption right now."""
    return get_nudges(building_id)


@router.get("/anomalies")
def anomalies(threshold: float = Query(0.05, ge=0, le=1)):
    """Buildings with anomalous consumption detected by Isolation Forest."""
    return get_anomalies(threshold)


@router.get("/forecast/{building_id}")
def forecast(building_id: str, horizon_hours: int = 24):
    """24-hour demand forecast for a building."""
    return get_forecast(building_id, horizon_hours)
