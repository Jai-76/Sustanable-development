# Campus Sustainability AI Platform

> **AI-driven waste reduction, energy optimisation, and emissions tracking** for campuses and nearby communities.

---

## GitHub Repository

- https://github.com/Jai-76/Sustanable-development

---

## Overview

This platform turns raw sensor and operational data into **actionable intelligence** that students, facility managers, and local farmers can use today — not in five years.

| Module | What it does |
|--------|--------------|
| **Energy & Water Intelligence** | Real-time dashboards for hostels, labs, and facilities with AI-generated nudges |
| **Agri-Tech Decision Support** | ML-guided irrigation, pest detection, and soil health for campus farms/incubators |
| **Environmental Sensing** | Low-power IoT simulation + efficient on-device inference for continuous monitoring |
| **Air Quality & Climate Insights** | Hyperlocal AQI forecasting tied to campus behaviour and local policy |
| **E-Waste & Upcycling Flows** | Computer-vision classification of discarded items + logistics routing |

---

## Architecture

```
campus-sustainability-ai/
├── frontend/          # Next.js 14 + Tailwind CSS dashboards
│   ├── app/           # App router pages
│   ├── components/    # Reusable UI components
│   └── lib/           # API client, utilities
│
├── backend/           # Python FastAPI AI services
│   ├── routers/       # Endpoint groups per module
│   ├── services/      # Business logic + ML inference
│   ├── models/        # Pydantic schemas
│   └── data/          # Simulated sensor feeds
│
├── ml/                # Training scripts and model artefacts
│   ├── energy/        # Anomaly detection, demand forecasting
│   ├── agritech/      # Irrigation, pest, soil models
│   ├── airquality/    # AQI forecasting
│   └── ewaste/        # Vision classification
│
└── sensors/           # Edge simulation (MQTT publisher)
    └── simulator.py
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- (Optional) Docker + docker-compose

### 1 — Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2 — Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

### 3 — Sensor Simulator (optional)

```bash
cd sensors
python simulator.py  # publishes mock readings every 5 s
```

---

## Module Deep-Dives

### Energy & Water Intelligence
- **Anomaly detection** using Isolation Forest on rolling 15-min consumption windows
- **Demand forecasting** (LSTM) 24 h ahead per building
- **Nudge engine**: rule + ML hybrid that suggests the three highest-impact actions for the next hour

### Agri-Tech Decision Support
- **Irrigation scheduling**: soil-moisture + weather-forecast fusion, outputs valve open/close times
- **Pest risk scoring**: logistic regression on temperature, humidity, and crop-growth stage
- **Soil health index**: weighted composite (pH, nitrogen, moisture) with trend alerts

### Air Quality & Climate Insights
- **AQI forecasting** per GPS grid cell (XGBoost, 6 h horizon)
- **Behaviour correlation**: overlays campus event calendar against PM2.5 spikes
- **Policy simulator**: what-if slider for vehicle bans, green-roof area, etc.

### E-Waste & Upcycling Flows
- **CV classifier** (MobileNetV3 fine-tuned on 10 e-waste categories)
- **Upcycling opportunity scoring**: maps items to campus maker-space projects
- **Collection logistics**: greedy TSP heuristic minimising collection-van distance

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Frontend → backend URL |
| `SENSOR_INTERVAL_SEC` | `5` | Simulator publish frequency |
| `MODEL_CACHE_DIR` | `./ml/artefacts` | Where trained models are stored |

---

## Contributing

1. Pick a module from the exploration paths above.
2. Create a branch: `git checkout -b feat/your-module`
3. Add tests in `backend/tests/` and run `pytest`.
4. Open a PR with a short description of the sustainability impact.

---

## License
MIT — build freely, attribute kindly.
