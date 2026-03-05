"""
Campus Sensor Simulator
Publishes synthetic sensor readings to stdout (and optionally MQTT).
Can also POST directly to the backend REST API for no-broker development.

Usage:
  python sensors/simulator.py                    # POST to API (default)
  python sensors/simulator.py --mode mqtt        # Publish to MQTT broker
  python sensors/simulator.py --interval 10      # Every 10 seconds
"""
import argparse
import json
import math
import random
import time
from datetime import datetime

# ── Sensor catalogue ──────────────────────────────────────────────────────────
SENSORS = [
    {"id": "sn-001", "location": "Hostel A — Floor 1",   "type": "energy"},
    {"id": "sn-002", "location": "CS Lab",               "type": "energy"},
    {"id": "sn-003", "location": "North Farm",           "type": "soil"},
    {"id": "sn-004", "location": "East Nursery",         "type": "soil"},
    {"id": "sn-005", "location": "Main Gate",            "type": "air"},
    {"id": "sn-006", "location": "Lab Complex",          "type": "air"},
    {"id": "sn-007", "location": "Admin Building",       "type": "water"},
    {"id": "sn-008", "location": "Canteen",              "type": "water"},
    {"id": "sn-009", "location": "Sports Ground",        "type": "weather"},
    {"id": "sn-010", "location": "Greenhouse A",         "type": "soil"},
]


# ── Realistic per-type reading generators ─────────────────────────────────────
def _gauss(mu, sigma, lo=None, hi=None):
    v = random.gauss(mu, sigma)
    if lo is not None: v = max(lo, v)
    if hi is not None: v = min(hi, v)
    return round(v, 2)


def energy_reading(hour: int) -> dict:
    base_power = 500 + 1500 * max(0, math.sin((hour - 7) / 12 * math.pi))
    return {
        "voltage_v":  _gauss(230, 3, 210, 250),
        "current_a":  _gauss(base_power / 230, 0.5, 0.1, 20),
        "power_w":    _gauss(base_power, 120, 50, 5000),
        "freq_hz":    _gauss(50.0, 0.05, 49.5, 50.5),
    }


def soil_reading() -> dict:
    return {
        "moisture_pct":    _gauss(38, 6, 5, 80),
        "temperature_c":   _gauss(28, 3, 15, 45),
        "ec_us_cm":        _gauss(420, 80, 100, 1200),
        "nitrogen_ppm":    _gauss(280, 60, 50, 600),
        "phosphorus_ppm":  _gauss(45, 12, 5, 120),
        "potassium_ppm":   _gauss(320, 70, 80, 700),
    }


def air_reading(hour: int) -> dict:
    # Rush-hour PM spike
    rush = 1 + 0.5 * max(0, math.sin((hour - 8) / 3 * math.pi) if 7 <= hour <= 11 else
                            math.sin((hour - 17) / 3 * math.pi) if 16 <= hour <= 20 else 0)
    return {
        "pm25_ug_m3":   _gauss(28 * rush, 5, 2, 300),
        "pm10_ug_m3":   _gauss(48 * rush, 8, 5, 450),
        "co2_ppm":      _gauss(520, 80, 380, 2000),
        "no2_ppb":      _gauss(22 * rush, 5, 1, 120),
        "temperature_c":_gauss(32, 4, 18, 45),
        "humidity_pct": _gauss(60, 10, 20, 95),
    }


def water_reading(hour: int) -> dict:
    # Peak flow during morning/evening
    peak = 1 + 0.8 * max(0, math.sin((hour - 7) / 3 * math.pi) if 6 <= hour <= 10 else
                            math.sin((hour - 18) / 3 * math.pi) if 17 <= hour <= 22 else 0)
    return {
        "flow_l_min":   max(0, _gauss(10 * peak, 3)),
        "pressure_bar": _gauss(3.0, 0.3, 0.5, 6),
        "temp_c":       _gauss(28, 3, 15, 50),
        "tds_ppm":      _gauss(220, 40, 50, 800),
    }


def weather_reading(hour: int) -> dict:
    solar = max(0, _gauss(600 * math.sin(max(0, (hour - 6) / 12 * math.pi)), 50))
    return {
        "temperature_c":  _gauss(30, 4, 15, 44),
        "humidity_pct":   _gauss(65, 12, 20, 98),
        "wind_kmh":       max(0, _gauss(8, 4)),
        "solar_w_m2":     round(solar),
        "rainfall_mm_hr": max(0, _gauss(0, 0.3)),
    }


GENERATORS = {
    "energy":  lambda h: energy_reading(h),
    "soil":    lambda h: soil_reading(),
    "air":     lambda h: air_reading(h),
    "water":   lambda h: water_reading(h),
    "weather": lambda h: weather_reading(h),
}


# ── Payload builder ───────────────────────────────────────────────────────────
def build_payload(sensor: dict, hour: int) -> dict:
    online = random.random() > 0.03   # 97% uptime
    payload = {
        "sensor_id": sensor["id"],
        "location":  sensor["location"],
        "type":      sensor["type"],
        "timestamp": datetime.now().isoformat(),
        "online":    online,
    }
    if online:
        payload["data"] = GENERATORS[sensor["type"]](hour)
    else:
        payload["data"] = {}
    return payload


# ── Transport modes ───────────────────────────────────────────────────────────
def run_api_mode(interval: int, api_url: str):
    """POST each reading to the backend (simple dev mode — no broker needed)."""
    try:
        import httpx
    except ImportError:
        print("httpx not installed. Run: pip install httpx")
        return

    print(f"[API mode] Posting to {api_url} every {interval}s")
    while True:
        hour = datetime.now().hour
        for sensor in SENSORS:
            payload = build_payload(sensor, hour)
            ts = datetime.now().strftime("%H:%M:%S")
            print(f"  [{ts}] {sensor['id']} ({sensor['type']}) → {'online' if payload['online'] else 'OFFLINE'}")
            try:
                httpx.post(f"{api_url}/api/sensors/ingest", json=payload, timeout=3)
            except Exception:
                pass  # backend may not implement /ingest — reading is for simulation
        time.sleep(interval)


def run_mqtt_mode(interval: int, broker: str, port: int):
    """Publish readings to MQTT topics: campus/sensors/<sensor_id>"""
    try:
        import paho.mqtt.client as mqtt
    except ImportError:
        print("paho-mqtt not installed. Run: pip install paho-mqtt")
        return

    client = mqtt.Client(client_id="campus-simulator")
    client.connect(broker, port, 60)
    client.loop_start()
    print(f"[MQTT mode] → {broker}:{port}  interval={interval}s")
    while True:
        hour = datetime.now().hour
        for sensor in SENSORS:
            payload = build_payload(sensor, hour)
            topic   = f"campus/sensors/{sensor['id']}"
            client.publish(topic, json.dumps(payload))
            print(f"  MQTT {topic} → {list(payload.get('data', {}).items())[:2]}…")
        time.sleep(interval)


def run_stdout_mode(interval: int):
    """Simply print readings — useful for debugging."""
    print(f"[STDOUT mode]  interval={interval}s  Ctrl-C to stop")
    while True:
        hour = datetime.now().hour
        readings = [build_payload(s, hour) for s in SENSORS]
        print(json.dumps(readings, indent=2))
        time.sleep(interval)


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Campus Sensor Simulator')
    parser.add_argument('--mode',     choices=['api', 'mqtt', 'stdout'], default='api')
    parser.add_argument('--interval', type=int,   default=5,                   help='Seconds between publishes')
    parser.add_argument('--api_url',  type=str,   default='http://localhost:8000')
    parser.add_argument('--broker',   type=str,   default='localhost')
    parser.add_argument('--port',     type=int,   default=1883)
    args = parser.parse_args()

    try:
        if args.mode == 'api':
            run_api_mode(args.interval, args.api_url)
        elif args.mode == 'mqtt':
            run_mqtt_mode(args.interval, args.broker, args.port)
        else:
            run_stdout_mode(args.interval)
    except KeyboardInterrupt:
        print("\nSimulator stopped.")
