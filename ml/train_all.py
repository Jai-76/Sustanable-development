"""
Master training script — trains all models that don't require external data.
Usage: python ml/train_all.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from ml.energy.train      import train_anomaly_detector
from ml.agritech.train    import train_pest_model
from ml.airquality.train  import train_aqi_model

print("=" * 55)
print(" Campus Sustainability AI — Training All Models")
print("=" * 55)

print("\n[1/3] Energy Anomaly Detection")
train_anomaly_detector()

print("\n[2/3] Agri-Tech Pest Risk")
train_pest_model()

print("\n[3/3] Air Quality AQI Forecasting")
train_aqi_model()

print("\n✓ All models trained and saved to ml/artefacts/")
print("  Note: E-waste CV classifier requires labelled image data.")
print("        Run: python ml/ewaste/train.py --data_dir <path>")
