"""Agri-Tech decision-support service."""
import random
from datetime import datetime, timedelta
import math

PLOTS = [
    {"id": "plot-01", "name": "North Farm — Tomato",    "crop": "tomato",  "area_m2": 2000, "growth_stage": "flowering"},
    {"id": "plot-02", "name": "East Nursery — Leafy",   "crop": "spinach", "area_m2": 800,  "growth_stage": "vegetative"},
    {"id": "plot-03", "name": "Greenhouse A — Herbs",   "crop": "basil",   "area_m2": 300,  "growth_stage": "mature"},
    {"id": "plot-04", "name": "South Field — Groundnut","crop": "groundnut","area_m2": 3500, "growth_stage": "pod-fill"},
    {"id": "plot-05", "name": "Incubator Plot — Chilli","crop": "chilli",  "area_m2": 600,  "growth_stage": "fruiting"},
]

PEST_FACTORS = {
    "tomato":   ["whitefly", "leaf-curl virus", "early blight"],
    "spinach":  ["aphids", "downy mildew"],
    "basil":    ["thrips", "fusarium wilt"],
    "groundnut":["groundnut leafminer", "late leaf spot"],
    "chilli":   ["thrips", "fruit borer", "powdery mildew"],
}


def _soil_reading(plot_id: str):
    seed = sum(ord(c) for c in plot_id)
    rng = random.Random(seed + datetime.now().hour)
    return {
        "moisture_pct": round(rng.uniform(18, 55), 1),
        "ph": round(rng.uniform(5.8, 7.5), 2),
        "nitrogen_ppm": round(rng.uniform(120, 480), 0),
        "phosphorus_ppm": round(rng.uniform(20, 80), 0),
        "potassium_ppm": round(rng.uniform(150, 500), 0),
        "temperature_c": round(rng.uniform(22, 35), 1),
    }


def get_farm_summary():
    plots_data = []
    for p in PLOTS:
        soil = _soil_reading(p["id"])
        moisture_ok = 30 <= soil["moisture_pct"] <= 50
        plots_data.append({
            "id": p["id"],
            "name": p["name"],
            "crop": p["crop"],
            "area_m2": p["area_m2"],
            "growth_stage": p["growth_stage"],
            "soil_moisture_pct": soil["moisture_pct"],
            "moisture_status": "optimal" if moisture_ok else ("dry" if soil["moisture_pct"] < 30 else "wet"),
            "soil_ph": soil["ph"],
            "pest_risk": round(random.uniform(0.05, 0.85), 2),
        })
    return {"timestamp": datetime.now().isoformat(), "plots": plots_data}


def get_irrigation_schedule(plot_id: str):
    plot = next((p for p in PLOTS if p["id"] == plot_id), PLOTS[0])
    soil = _soil_reading(plot_id)
    now = datetime.now()

    # Simple ETc estimation (mock Penman-Monteith proxy)
    etc_mm_per_day = round(random.uniform(3.5, 8.5), 2)
    deficit_mm = max(0, (40 - soil["moisture_pct"]) * 0.8)
    volume_litres = round(deficit_mm * plot["area_m2"] * 0.001 * 1000, 0)

    schedule = []
    if deficit_mm > 2:
        schedule.append({
            "slot": "today",
            "start_time": (now + timedelta(hours=2)).strftime("%H:%M"),
            "duration_min": round(deficit_mm * 6, 0),
            "volume_litres": volume_litres,
            "method": "drip" if plot["area_m2"] < 1000 else "sprinkler",
        })
    for i in range(1, 4):
        future_deficit = max(0, deficit_mm - 2 + random.uniform(-1, 3))
        if future_deficit > 1.5:
            schedule.append({
                "slot": f"day+{i}",
                "start_time": "06:00",
                "duration_min": round(future_deficit * 6, 0),
                "volume_litres": round(future_deficit * plot["area_m2"] * 0.001 * 1000, 0),
                "method": "drip" if plot["area_m2"] < 1000 else "sprinkler",
            })

    return {
        "plot_id": plot_id,
        "plot_name": plot["name"],
        "soil_moisture_pct": soil["moisture_pct"],
        "etc_mm_per_day": etc_mm_per_day,
        "deficit_mm": round(deficit_mm, 2),
        "schedule": schedule,
        "water_saving_vs_flood_pct": 42,
    }


def get_pest_risk(plot_id: str):
    plot = next((p for p in PLOTS if p["id"] == plot_id), PLOTS[0])
    soil = _soil_reading(plot_id)
    temp = soil["temperature_c"]
    humidity = random.uniform(40, 90)

    # Logistic regression proxy
    risk_score = 1 / (1 + math.exp(-(0.08 * temp + 0.03 * humidity - 5 + random.gauss(0, 0.3))))
    pests = PEST_FACTORS.get(plot["crop"], ["aphids"])
    active = random.sample(pests, min(2, len(pests))) if risk_score > 0.5 else []

    return {
        "plot_id": plot_id,
        "risk_score": round(risk_score, 3),
        "risk_level": "high" if risk_score > 0.65 else ("medium" if risk_score > 0.35 else "low"),
        "active_threats": active,
        "contributing_factors": {
            "temperature_c": temp,
            "humidity_pct": round(humidity, 1),
            "growth_stage": plot["growth_stage"],
        },
        "recommended_action": "Apply neem-oil spray (1:50) on undersides of leaves." if risk_score > 0.65
            else ("Scout daily and record symptoms." if risk_score > 0.35 else "No intervention needed."),
    }


def get_soil_health(plot_id: str):
    soil = _soil_reading(plot_id)
    # Weighted soil health index
    ph_score     = max(0, 1 - abs(soil["ph"] - 6.5) / 1.5)
    n_score      = min(1, soil["nitrogen_ppm"] / 400)
    p_score      = min(1, soil["phosphorus_ppm"] / 60)
    k_score      = min(1, soil["potassium_ppm"] / 400)
    moisture_score = max(0, 1 - abs(soil["moisture_pct"] - 40) / 20)
    index = round((ph_score * 0.2 + n_score * 0.3 + p_score * 0.2 + k_score * 0.15 + moisture_score * 0.15) * 100, 1)

    alerts = []
    if soil["ph"] < 6.0:   alerts.append("Soil pH low — consider lime application.")
    if soil["ph"] > 7.2:   alerts.append("Soil pH high — consider sulphur amendment.")
    if n_score < 0.4:       alerts.append("Nitrogen deficiency — apply organic compost.")
    if moisture_score < 0.3:alerts.append("Critical moisture deviation — check irrigation.")

    return {
        "plot_id": plot_id,
        "health_index": index,
        "grade": "A" if index >= 80 else ("B" if index >= 60 else ("C" if index >= 40 else "D")),
        "readings": soil,
        "component_scores": {
            "ph": round(ph_score, 2),
            "nitrogen": round(n_score, 2),
            "phosphorus": round(p_score, 2),
            "potassium": round(k_score, 2),
            "moisture": round(moisture_score, 2),
        },
        "alerts": alerts,
        "trend": random.choice(["improving", "stable", "degrading"]),
    }
