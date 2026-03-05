"""Air Quality & Climate Insights service."""
import random
import math
from datetime import datetime, timedelta

SENSOR_GRID = [
    {"id": "aq-01", "name": "Main Gate",         "lat": 12.9716, "lon": 77.5946},
    {"id": "aq-02", "name": "Hostel Cluster",    "lat": 12.9720, "lon": 77.5960},
    {"id": "aq-03", "name": "Lab Complex",       "lat": 12.9708, "lon": 77.5938},
    {"id": "aq-04", "name": "Sports Ground",     "lat": 12.9730, "lon": 77.5950},
    {"id": "aq-05", "name": "Farm Area",         "lat": 12.9700, "lon": 77.5930},
    {"id": "aq-06", "name": "Community Perimeter","lat":12.9740, "lon": 77.5970},
]

CAMPUS_EVENTS = [
    {"event": "Generator testing", "day_offset": -2, "pm25_impact": +18},
    {"event": "Bonfire Night",     "day_offset": -5, "pm25_impact": +35},
    {"event": "Heavy traffic day", "day_offset": -1, "pm25_impact": +12},
    {"event": "Car-free Saturday", "day_offset": -7, "pm25_impact": -9},
    {"event": "Lab ventilation maintenance", "day_offset": -3, "pm25_impact": +6},
]

AQI_BREAKPOINTS_PM25 = [
    (0,   12.0,  0,   50,   "Good"),
    (12.1, 35.4, 51,  100,  "Moderate"),
    (35.5, 55.4, 101, 150,  "Unhealthy for Sensitive Groups"),
    (55.5, 150.4,151, 200,  "Unhealthy"),
    (150.5,250.4,201, 300,  "Very Unhealthy"),
    (250.5,500,  301, 500,  "Hazardous"),
]


def _pm25_to_aqi(pm25: float) -> tuple[int, str]:
    for lo_c, hi_c, lo_a, hi_a, cat in AQI_BREAKPOINTS_PM25:
        if lo_c <= pm25 <= hi_c:
            aqi = round((hi_a - lo_a) / (hi_c - lo_c) * (pm25 - lo_c) + lo_a)
            return aqi, cat
    return 500, "Hazardous"


def _base_pm25(hour: int) -> float:
    """Traffic/activity driven diurnal PM2.5 pattern."""
    traffic = math.sin(math.radians((hour - 8) * 15)) * 15 + 25
    return max(8, traffic + random.gauss(0, 3))


def get_current_aqi():
    now = datetime.now()
    readings = []
    for s in SENSOR_GRID:
        pm25 = round(_base_pm25(now.hour) + random.gauss(0, 5), 1)
        pm10 = round(pm25 * random.uniform(1.3, 1.8), 1)
        no2  = round(random.uniform(10, 60), 1)
        aqi, category = _pm25_to_aqi(pm25)
        readings.append({
            **s,
            "pm25": pm25,
            "pm10": pm10,
            "no2_ppb": no2,
            "aqi": aqi,
            "category": category,
            "timestamp": now.isoformat(),
        })
    avg_aqi = round(sum(r["aqi"] for r in readings) / len(readings))
    _, avg_cat = _pm25_to_aqi(sum(r["pm25"] for r in readings) / len(readings))
    return {
        "timestamp": now.isoformat(),
        "campus_avg_aqi": avg_aqi,
        "campus_category": avg_cat,
        "sensors": readings,
    }


def get_aqi_forecast(horizon_hours: int):
    now = datetime.now().replace(minute=0, second=0, microsecond=0)
    forecast = []
    for h in range(1, horizon_hours + 1):
        ts = now + timedelta(hours=h)
        pm25 = round(_base_pm25(ts.hour) + random.gauss(0, 4), 1)
        aqi, cat = _pm25_to_aqi(pm25)
        forecast.append({
            "timestamp": ts.isoformat(),
            "predicted_pm25": pm25,
            "predicted_aqi": aqi,
            "category": cat,
            "confidence_pct": round(random.uniform(72, 94), 1),
        })
    return {"horizon_hours": horizon_hours, "model": "XGBoost-AQI-v2", "forecast": forecast}


def get_behaviour_correlations():
    correlations = []
    for ev in CAMPUS_EVENTS:
        day = datetime.now() + timedelta(days=ev["day_offset"])
        correlations.append({
            "event": ev["event"],
            "date": day.strftime("%Y-%m-%d"),
            "pm25_delta": ev["pm25_impact"],
            "impact_direction": "increase" if ev["pm25_impact"] > 0 else "decrease",
            "significance": "high" if abs(ev["pm25_impact"]) > 15 else "medium",
        })
    return {"correlations": correlations, "insight": "Generator testing and bonfires are the two largest controllable PM2.5 sources on campus."}


def get_policy_simulation(vehicle_ban_pct: float, green_roof_area_m2: float, diesel_gen_hours: float):
    baseline_pm25 = _base_pm25(datetime.now().hour)
    delta = -(vehicle_ban_pct * 0.08) - (green_roof_area_m2 * 0.001) + (diesel_gen_hours * 2.5)
    projected = round(max(5, baseline_pm25 + delta), 1)
    proj_aqi, proj_cat = _pm25_to_aqi(projected)
    baseline_aqi, baseline_cat = _pm25_to_aqi(baseline_pm25)
    return {
        "baseline_pm25": round(baseline_pm25, 1),
        "baseline_aqi": baseline_aqi,
        "baseline_category": baseline_cat,
        "projected_pm25": projected,
        "projected_aqi": proj_aqi,
        "projected_category": proj_cat,
        "delta_pm25": round(delta, 2),
        "inputs": {
            "vehicle_ban_pct": vehicle_ban_pct,
            "green_roof_area_m2": green_roof_area_m2,
            "diesel_gen_hours": diesel_gen_hours,
        },
    }
