"""Agri-Tech router."""
from fastapi import APIRouter
from services.agritech_service import (
    get_irrigation_schedule,
    get_pest_risk,
    get_soil_health,
    get_farm_summary,
)

router = APIRouter()


@router.get("/summary")
def farm_summary():
    """Overview of all active farm plots."""
    return get_farm_summary()


@router.get("/irrigation/{plot_id}")
def irrigation(plot_id: str):
    """Recommended irrigation schedule for the next 48 hours."""
    return get_irrigation_schedule(plot_id)


@router.get("/pest-risk/{plot_id}")
def pest_risk(plot_id: str):
    """Pest risk score (0–1) with contributing factors."""
    return get_pest_risk(plot_id)


@router.get("/soil-health/{plot_id}")
def soil_health(plot_id: str):
    """Composite soil health index and trend."""
    return get_soil_health(plot_id)
