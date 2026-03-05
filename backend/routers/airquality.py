"""Air Quality router."""
from fastapi import APIRouter
from services.airquality_service import (
    get_current_aqi,
    get_aqi_forecast,
    get_behaviour_correlations,
    get_policy_simulation,
)

router = APIRouter()


@router.get("/current")
def current():
    """Current AQI readings across campus sensor grid."""
    return get_current_aqi()


@router.get("/forecast")
def forecast(horizon_hours: int = 6):
    """AQI forecast grid for the next N hours."""
    return get_aqi_forecast(horizon_hours)


@router.get("/correlations")
def correlations():
    """Campus behaviour events correlated with historical AQI spikes."""
    return get_behaviour_correlations()


@router.get("/policy-sim")
def policy_sim(
    vehicle_ban_pct: float = 0,
    green_roof_area_m2: float = 0,
    diesel_gen_hours: float = 0,
):
    """What-if simulation: how do policy changes affect projected AQI?"""
    return get_policy_simulation(vehicle_ban_pct, green_roof_area_m2, diesel_gen_hours)
