"""Energy & Water intelligence service."""
import random
import math
from datetime import datetime, timedelta
from typing import Literal
import numpy as np

try:
    from sklearn.ensemble import IsolationForest
    _SKLEARN_OK = True
except Exception:
    _SKLEARN_OK = False

BUILDINGS = [
    {"id": "hostel-a",  "name": "Hostel A",        "type": "hostel",   "capacity": 240},
    {"id": "hostel-b",  "name": "Hostel B",        "type": "hostel",   "capacity": 180},
    {"id": "lab-cs",    "name": "CS Lab Block",    "type": "lab",      "capacity": 320},
    {"id": "lab-bio",   "name": "Bio Lab Block",   "type": "lab",      "capacity": 160},
    {"id": "admin",     "name": "Admin Building",  "type": "admin",    "capacity": 90},
    {"id": "canteen",   "name": "Main Canteen",    "type": "canteen",  "capacity": 500},
    {"id": "library",   "name": "Central Library", "type": "library",  "capacity": 400},
]

NUDGE_BANK = {
    "hostel":   [
        "Turn off geysers between 10 am–4 pm — solar water is available.",
        "Corridor lights auto-off at midnight saves ~18 kWh/night.",
        "Unplug phone chargers when rooms are empty — vampire load adds up.",
        "Switch to cold wash — reduces laundry energy by 60 %.",
    ],
    "lab":      [
        "Shut down idle workstations overnight to cut 40 % lab standby consumption.",
        "Enable deep-sleep on monitors not used for > 5 min.",
        "Batch autoclave runs — half-full loads waste 30 % energy.",
        "Bio-lab centrifuges on off-peak hours reduce peak demand charges.",
    ],
    "admin":    [
        "Set AC setpoint to 24 °C — each degree below costs 6 % more electricity.",
        "Use natural light before 10 am and after 3 pm.",
        "Duplex printing by default saves 50 % paper and associated energy.",
    ],
    "canteen":  [
        "Pre-cool walk-in freezers at night when grid is green.",
        "Compost wet waste on-site — reduces 3 t CO₂-eq/month.",
        "Switch deep-fryers to air-fryers for small batches.",
    ],
    "library":  [
        "Occupancy-based lighting zoning can cut library electricity by 35 %.",
        "Close north-facing blinds on winter afternoons to retain heat.",
        "Reduce HVAC runtime by 2 h on Sundays when occupancy is < 15 %.",
    ],
}


def _baseline_kw(building_type: str, hour: int) -> float:
    """Simulate realistic hourly baseline in kW."""
    profiles = {
        "hostel":  [2, 1.8, 1.6, 1.5, 1.6, 2.5, 5, 6, 5.5, 4, 3.5, 3, 3, 2.8, 3, 3.5, 5, 8, 9, 9, 8, 7, 5, 3],
        "lab":     [0.5, 0.4, 0.4, 0.4, 0.5, 0.6, 1, 4, 8, 10, 11, 11, 10, 10, 11, 12, 12, 9, 4, 2, 1, 0.8, 0.6, 0.5],
        "admin":   [0.3, 0.3, 0.3, 0.3, 0.3, 0.4, 0.5, 2, 6, 8, 9, 9, 8, 9, 9, 8, 6, 3, 1, 0.5, 0.4, 0.4, 0.3, 0.3],
        "canteen": [0.5, 0.4, 0.4, 0.5, 1, 2, 4, 6, 8, 7, 6, 8, 10, 7, 5, 5, 7, 8, 6, 4, 2, 1, 0.7, 0.6],
        "library": [0.3, 0.3, 0.2, 0.2, 0.2, 0.3, 0.5, 1, 5, 7, 8, 8, 7, 8, 8, 8, 7, 5, 3, 1, 0.5, 0.4, 0.3, 0.3],
    }
    base = profiles.get(building_type, profiles["admin"])[hour % 24]
    return base * (1 + random.gauss(0, 0.05))


def get_dashboard_summary():
    now = datetime.now()
    buildings_data = []
    total_kwh = 0
    total_water_l = 0
    anomaly_count = 0

    for b in BUILDINGS:
        kwh = round(sum(_baseline_kw(b["type"], h) for h in range(24)) * (1 + random.gauss(0, 0.08)), 1)
        water = round(random.uniform(800, 4000), 0)
        is_anomaly = random.random() < 0.15
        if is_anomaly:
            kwh = round(kwh * random.uniform(1.4, 2.2), 1)
            anomaly_count += 1
        total_kwh += kwh
        total_water_l += water
        buildings_data.append({
            "id": b["id"],
            "name": b["name"],
            "type": b["type"],
            "kwh_today": kwh,
            "water_litres_today": water,
            "anomaly": is_anomaly,
            "intensity_kwh_per_person": round(kwh / b["capacity"], 2),
        })

    return {
        "timestamp": now.isoformat(),
        "campus_total_kwh": round(total_kwh, 1),
        "campus_total_water_litres": round(total_water_l, 0),
        "campus_co2_kg": round(total_kwh * 0.82, 1),  # India grid factor
        "anomaly_buildings": anomaly_count,
        "buildings": buildings_data,
    }


def get_building_timeseries(building_id: str, metric: str, hours: int):
    btype = next((b["type"] for b in BUILDINGS if b["id"] == building_id), "admin")
    now = datetime.now().replace(minute=0, second=0, microsecond=0)
    points = []
    for i in range(hours * 4):  # 15-min intervals
        ts = now - timedelta(minutes=15 * (hours * 4 - i))
        val = _baseline_kw(btype, ts.hour) * 0.25  # kWh per 15 min
        if metric == "water":
            val = round(random.uniform(20, 120), 1)
        else:
            val = round(val, 3)
        points.append({"timestamp": ts.isoformat(), "value": val, "unit": "kWh" if metric != "water" else "L"})
    return {"building_id": building_id, "metric": metric, "series": points}


def get_nudges(building_id: str):
    btype = next((b["type"] for b in BUILDINGS if b["id"] == building_id), "admin")
    pool = NUDGE_BANK.get(btype, NUDGE_BANK["admin"])
    chosen = random.sample(pool, min(3, len(pool)))
    return {
        "building_id": building_id,
        "nudges": [{"priority": i + 1, "message": m, "estimated_saving_kwh": round(random.uniform(2, 40), 1)} for i, m in enumerate(chosen)],
    }


def get_anomalies(threshold: float):
    rng = np.random.default_rng(42)
    X = rng.normal(loc=5, scale=1, size=(200, 4))
    X[-5:] *= 3   # inject outliers

    if _SKLEARN_OK:
        from sklearn.ensemble import IsolationForest
        clf = IsolationForest(contamination=max(threshold, 0.01), random_state=42)
        clf.fit(X)
        raw_scores = clf.decision_function(X)
        # Lower score = more anomalous; pick the most anomalous rows
        anomaly_indices = np.argsort(raw_scores)[:min(5, int(threshold * 200) + 1)]
        anomalous = [
            {
                "building_id": BUILDINGS[i % len(BUILDINGS)]["id"],
                "name":        BUILDINGS[i % len(BUILDINGS)]["name"],
                "anomaly_score": round(float(raw_scores[anomaly_indices[i]]), 4),
                "excess_kwh_estimate": round(random.uniform(20, 150), 1),
                "method": "IsolationForest",
            }
            for i in range(len(anomaly_indices))
        ]
    else:
        # Fallback: z-score anomaly detection (no sklearn required)
        scores = np.abs((X - X.mean(axis=0)) / (X.std(axis=0) + 1e-9)).mean(axis=1)
        n_flag = max(1, int(threshold * len(scores)))
        anomaly_indices = np.argsort(scores)[-n_flag:][::-1][:5]
        anomalous = [
            {
                "building_id": BUILDINGS[i % len(BUILDINGS)]["id"],
                "name":        BUILDINGS[i % len(BUILDINGS)]["name"],
                "anomaly_score": round(-float(scores[anomaly_indices[i]]), 4),
                "excess_kwh_estimate": round(random.uniform(20, 150), 1),
                "method": "z-score (sklearn unavailable)",
            }
            for i in range(len(anomaly_indices))
        ]

    return {"anomalies": anomalous, "threshold": threshold}


def get_forecast(building_id: str, horizon_hours: int):
    btype = next((b["type"] for b in BUILDINGS if b["id"] == building_id), "admin")
    now = datetime.now().replace(minute=0, second=0, microsecond=0)
    points = []
    for h in range(horizon_hours):
        ts = now + timedelta(hours=h + 1)
        val = round(_baseline_kw(btype, ts.hour) * (1 + random.gauss(0, 0.03)), 3)
        points.append({"timestamp": ts.isoformat(), "kwh": val, "confidence_interval": [round(val * 0.88, 3), round(val * 1.12, 3)]})
    total_forecast = round(sum(p["kwh"] for p in points), 1)
    return {"building_id": building_id, "horizon_hours": horizon_hours, "total_kwh": total_forecast, "forecast": points}
