"""Sensor data aggregation service."""
import random
from datetime import datetime

SENSOR_NODES = [
    {"id": "sn-001", "location": "Hostel A — Floor 1",  "type": "energy",   "lat": 12.9718, "lon": 77.5948},
    {"id": "sn-002", "location": "CS Lab",              "type": "energy",   "lat": 12.9708, "lon": 77.5938},
    {"id": "sn-003", "location": "North Farm",          "type": "soil",     "lat": 12.9700, "lon": 77.5930},
    {"id": "sn-004", "location": "East Nursery",        "type": "soil",     "lat": 12.9702, "lon": 77.5932},
    {"id": "sn-005", "location": "Main Gate",           "type": "air",      "lat": 12.9716, "lon": 77.5946},
    {"id": "sn-006", "location": "Lab Complex",         "type": "air",      "lat": 12.9708, "lon": 77.5938},
    {"id": "sn-007", "location": "Admin Building",      "type": "water",    "lat": 12.9712, "lon": 77.5952},
    {"id": "sn-008", "location": "Canteen",             "type": "water",    "lat": 12.9725, "lon": 77.5943},
    {"id": "sn-009", "location": "Sports Ground",       "type": "weather",  "lat": 12.9730, "lon": 77.5950},
    {"id": "sn-010", "location": "Greenhouse A",        "type": "soil",     "lat": 12.9698, "lon": 77.5928},
]


def _reading_for_type(sensor_type: str) -> dict:
    now = datetime.now()
    if sensor_type == "energy":
        return {
            "voltage_v": round(random.uniform(218, 242), 1),
            "current_a": round(random.uniform(0.5, 15), 2),
            "power_w":   round(random.uniform(100, 3000), 0),
            "freq_hz":   round(random.uniform(49.8, 50.2), 2),
        }
    if sensor_type == "soil":
        return {
            "moisture_pct":     round(random.uniform(15, 60), 1),
            "temperature_c":    round(random.uniform(22, 35), 1),
            "ec_us_cm":         round(random.uniform(200, 800), 0),
            "nitrogen_ppm":     round(random.uniform(100, 500), 0),
        }
    if sensor_type == "air":
        return {
            "pm25_ug_m3":  round(random.uniform(8, 80), 1),
            "pm10_ug_m3":  round(random.uniform(15, 120), 1),
            "co2_ppm":     round(random.uniform(390, 1200), 0),
            "no2_ppb":     round(random.uniform(5, 60), 1),
            "temperature_c": round(random.uniform(24, 38), 1),
            "humidity_pct":  round(random.uniform(30, 85), 1),
        }
    if sensor_type == "water":
        return {
            "flow_l_min":   round(random.uniform(0, 25), 2),
            "pressure_bar": round(random.uniform(1.5, 4.5), 2),
            "temp_c":       round(random.uniform(20, 40), 1),
            "tds_ppm":      round(random.uniform(80, 400), 0),
        }
    if sensor_type == "weather":
        return {
            "temperature_c":  round(random.uniform(20, 38), 1),
            "humidity_pct":   round(random.uniform(30, 90), 1),
            "wind_kmh":       round(random.uniform(0, 25), 1),
            "solar_w_m2":     round(random.uniform(0, 1000), 0),
            "rainfall_mm_hr": round(max(0, random.gauss(0, 0.5)), 2),
        }
    return {}


def get_latest_readings():
    readings = []
    for s in SENSOR_NODES:
        readings.append({
            "sensor_id": s["id"],
            "location":  s["location"],
            "type":      s["type"],
            "timestamp": datetime.now().isoformat(),
            "online":    random.random() > 0.05,   # 95% uptime
            "data":      _reading_for_type(s["type"]),
        })
    return {"readings": readings, "count": len(readings)}


def get_sensor_map():
    return {
        "sensors": [
            {**s, "status": "online" if random.random() > 0.05 else "offline",
             "battery_pct": round(random.uniform(25, 100), 0)}
            for s in SENSOR_NODES
        ]
    }
