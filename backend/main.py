"""
Campus Sustainability AI — FastAPI backend entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import energy, agritech, airquality, ewaste, sensors

load_dotenv()

app = FastAPI(
    title="Campus Sustainability AI",
    description="AI-driven energy, agriculture, air-quality, and e-waste management for campuses.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(energy.router,    prefix="/api/energy",     tags=["Energy & Water"])
app.include_router(agritech.router,  prefix="/api/agritech",   tags=["Agri-Tech"])
app.include_router(airquality.router,prefix="/api/airquality", tags=["Air Quality"])
app.include_router(ewaste.router,    prefix="/api/ewaste",     tags=["E-Waste"])
app.include_router(sensors.router,   prefix="/api/sensors",    tags=["Sensors"])


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Campus Sustainability AI API is running."}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
