"""E-Waste & Upcycling service — classification + logistics."""
import random
import math
from datetime import datetime
from io import BytesIO

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

CATEGORIES = [
    "laptop",
    "mobile_phone",
    "cable_wire",
    "battery",
    "pcb_circuit_board",
    "crt_monitor",
    "printer_cartridge",
    "keyboard_mouse",
    "lighting_bulb",
    "power_adapter",
]

UPCYCLE_PROJECTS = {
    "pcb_circuit_board":  [{"project": "Maker-Space Arduino Kits", "slots_available": 12}, {"project": "Community Tech Workshop", "slots_available": 5}],
    "cable_wire":         [{"project": "DIY Speaker Lab", "slots_available": 8}, {"project": "Rope-Art Installation", "slots_available": 20}],
    "laptop":             [{"project": "Refurbish for Rural Schools", "slots_available": 3}],
    "mobile_phone":       [{"project": "Refurbish for Rural Schools", "slots_available": 6}, {"project": "IoT Sensor Node", "slots_available": 4}],
    "battery":            [{"project": "Solar Energy Storage Buffer", "slots_available": 10}],
    "keyboard_mouse":     [{"project": "Accessibility Device Repair", "slots_available": 7}],
    "crt_monitor":        [{"project": "Retro Gaming Club", "slots_available": 2}],
    "printer_cartridge":  [{"project": "Ink Refill Co-op", "slots_available": 15}],
    "lighting_bulb":      [{"project": "Light-Art Sculptures", "slots_available": 25}],
    "power_adapter":      [{"project": "Universal Charger Pool", "slots_available": 9}],
}

DROP_POINTS = [
    {"id": "dp-01", "name": "Library Foyer",      "lat": 12.9716, "lon": 77.5946, "items_pending": random.randint(0, 30)},
    {"id": "dp-02", "name": "CS Block Entrance",  "lat": 12.9708, "lon": 77.5938, "items_pending": random.randint(0, 30)},
    {"id": "dp-03", "name": "Hostel A Common Room","lat": 12.9720, "lon": 77.5960, "items_pending": random.randint(0, 30)},
    {"id": "dp-04", "name": "Admin Lobby",         "lat": 12.9712, "lon": 77.5952, "items_pending": random.randint(0, 30)},
    {"id": "dp-05", "name": "Canteen Side Gate",   "lat": 12.9725, "lon": 77.5943, "items_pending": random.randint(0, 30)},
]

RECENT_ITEMS = [
    {"id": f"EW-{1000+i}", "category": random.choice(CATEGORIES),
     "drop_point": random.choice(DROP_POINTS)["id"],
     "date": datetime.now().strftime("%Y-%m-%d"),
     "weight_kg": round(random.uniform(0.1, 4.5), 2)}
    for i in range(25)
]


def classify_item(image_bytes: bytes, filename: str):
    """
    Classify e-waste item from image.
    In production: use fine-tuned MobileNetV3.
    Here we return a mock top-k prediction.
    """
    # Deterministic mock based on filename hash
    seed = sum(ord(c) for c in filename) if filename else 42
    rng = random.Random(seed)
    rand_cats = rng.sample(CATEGORIES, 3)
    confidences = sorted([rng.uniform(0.4, 0.99), rng.uniform(0.05, 0.3), rng.uniform(0.01, 0.1)], reverse=True)

    top_cat = rand_cats[0]
    projects = UPCYCLE_PROJECTS.get(top_cat, [])

    return {
        "predictions": [{"category": rand_cats[i], "confidence": round(confidences[i], 3)} for i in range(3)],
        "top_category": top_cat,
        "disposal_guidance": f"Deposit at nearest e-waste drop point. Do NOT put in general waste.",
        "recycling_value": round(rng.uniform(10, 400), 0),
        "upcycle_opportunities": projects,
        "model": "MobileNetV3-EWaste-v1 (mock)",
    }


def get_upcycle_opportunities(category: str):
    if category == "all":
        result = []
        for cat, projects in UPCYCLE_PROJECTS.items():
            for p in projects:
                result.append({"category": cat, **p})
        return {"opportunities": result, "total": len(result)}
    projects = UPCYCLE_PROJECTS.get(category, [])
    return {"category": category, "opportunities": projects}


def _haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def get_collection_route():
    """Greedy nearest-neighbour TSP for collection van."""
    points = [p for p in DROP_POINTS if p["items_pending"] > 0]
    if not points:
        return {"route": [], "total_distance_m": 0, "total_items": 0}

    depot = {"lat": 12.9705, "lon": 77.5935, "name": "Waste Management Depot"}
    unvisited = points.copy()
    route = [{"stop": 0, "name": depot["name"], "lat": depot["lat"], "lon": depot["lon"], "items_collected": 0}]
    current = depot
    total_dist = 0

    stop_num = 1
    while unvisited:
        nearest = min(unvisited, key=lambda p: _haversine(current["lat"], current["lon"], p["lat"], p["lon"]))
        dist = _haversine(current["lat"], current["lon"], nearest["lat"], nearest["lon"])
        total_dist += dist
        route.append({
            "stop": stop_num,
            "id": nearest["id"],
            "name": nearest["name"],
            "lat": nearest["lat"],
            "lon": nearest["lon"],
            "items_collected": nearest["items_pending"],
            "distance_from_prev_m": round(dist, 1),
        })
        current = nearest
        unvisited.remove(nearest)
        stop_num += 1

    # Return to depot
    dist_back = _haversine(current["lat"], current["lon"], depot["lat"], depot["lon"])
    total_dist += dist_back
    route.append({"stop": stop_num, "name": depot["name"] + " (return)", "lat": depot["lat"], "lon": depot["lon"], "distance_from_prev_m": round(dist_back, 1), "items_collected": 0})

    return {
        "route": route,
        "total_distance_m": round(total_dist, 1),
        "total_items": sum(p["items_pending"] for p in points),
        "estimated_co2_saved_vs_individual_kg": round(total_dist * 0.00021 * 0.7, 3),
    }


def get_flow_summary():
    total_items = sum(p["items_pending"] for p in DROP_POINTS)
    categories = {}
    for item in RECENT_ITEMS:
        categories[item["category"]] = categories.get(item["category"], 0) + 1
    return {
        "timestamp": datetime.now().isoformat(),
        "drop_points": DROP_POINTS,
        "pending_collection": total_items,
        "items_this_month": len(RECENT_ITEMS),
        "weight_kg_this_month": round(sum(i["weight_kg"] for i in RECENT_ITEMS), 2),
        "category_breakdown": categories,
        "diverted_from_landfill_pct": 78,
        "recent_items": RECENT_ITEMS[:10],
    }
