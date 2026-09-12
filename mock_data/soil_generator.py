"""
Realistic mock soil data generator for Indian agricultural contexts.
Provides N-P-K, pH, moisture, and organic matter readings.
"""
import random
import math
from datetime import datetime


SOIL_TYPE_PROFILES = {
    "alluvial": {
        "n_range": (180, 320), "p_range": (14, 30), "k_range": (180, 320),
        "ph_range": (6.5, 7.8), "moisture_range": (40, 70), "om_range": (1.5, 3.2),
        "desc": "Alluvial soil — fertile, good water retention"
    },
    "black_cotton": {
        "n_range": (140, 260), "p_range": (8, 22), "k_range": (200, 380),
        "ph_range": (7.2, 8.5), "moisture_range": (35, 68), "om_range": (1.2, 2.8),
        "desc": "Black cotton (Vertisol) — high clay, shrinks when dry"
    },
    "red_laterite": {
        "n_range": (100, 200), "p_range": (5, 16), "k_range": (120, 250),
        "ph_range": (5.5, 6.8), "moisture_range": (25, 55), "om_range": (0.8, 2.0),
        "desc": "Red laterite — low fertility, acidic, good drainage"
    },
    "loamy": {
        "n_range": (200, 350), "p_range": (16, 35), "k_range": (200, 360),
        "ph_range": (6.2, 7.5), "moisture_range": (45, 72), "om_range": (2.0, 4.0),
        "desc": "Loamy soil — ideal texture, balanced fertility"
    },
    "sandy": {
        "n_range": (80, 160), "p_range": (5, 14), "k_range": (90, 180),
        "ph_range": (5.8, 7.2), "moisture_range": (15, 38), "om_range": (0.5, 1.5),
        "desc": "Sandy soil — low retention, fast draining, needs frequent irrigation"
    },
    "clay": {
        "n_range": (160, 280), "p_range": (12, 28), "k_range": (220, 400),
        "ph_range": (6.8, 8.0), "moisture_range": (50, 80), "om_range": (1.8, 3.5),
        "desc": "Clay soil — high moisture retention, risk of waterlogging"
    },
    "default": {
        "n_range": (150, 280), "p_range": (10, 25), "k_range": (160, 300),
        "ph_range": (6.0, 7.8), "moisture_range": (35, 65), "om_range": (1.2, 3.0),
        "desc": "Mixed soil — moderate fertility"
    },
}

DEFICIENCY_THRESHOLDS = {
    "N": {"low": 150, "critical": 100},
    "P": {"low": 10, "critical": 6},
    "K": {"low": 140, "critical": 100},
}


def _get_seed(soil_type: str, location: str) -> int:
    today = datetime.now().strftime("%Y%m%d")
    return hash(f"{soil_type}{location}{today}") % (2**32)


def _classify_nutrient(value: float, nutrient: str) -> str:
    thresholds = DEFICIENCY_THRESHOLDS.get(nutrient, {"low": 100, "critical": 50})
    if value < thresholds["critical"]:
        return "Critical"
    elif value < thresholds["low"]:
        return "Deficient"
    elif value < thresholds["low"] * 1.5:
        return "Adequate"
    else:
        return "Sufficient"


def _classify_ph(ph: float) -> str:
    if ph < 5.5:
        return "Highly Acidic"
    elif ph < 6.5:
        return "Moderately Acidic"
    elif ph < 7.5:
        return "Neutral (Optimal)"
    elif ph < 8.0:
        return "Mildly Alkaline"
    else:
        return "Alkaline"


def _classify_moisture(pct: float) -> str:
    if pct < 20:
        return "Critically Dry"
    elif pct < 35:
        return "Dry — Irrigation Recommended"
    elif pct < 55:
        return "Optimal"
    elif pct < 70:
        return "Moist"
    else:
        return "Waterlogged Risk"


def get_soil_data(soil_type: str = "default", location: str = "india") -> dict:
    profile = SOIL_TYPE_PROFILES.get(soil_type.lower().replace(" ", "_"), SOIL_TYPE_PROFILES["default"])
    rng = random.Random(_get_seed(soil_type, location))

    n = round(rng.uniform(*profile["n_range"]), 1)
    p = round(rng.uniform(*profile["p_range"]), 1)
    k = round(rng.uniform(*profile["k_range"]), 1)
    ph = round(rng.uniform(*profile["ph_range"]), 2)
    moisture = round(rng.uniform(*profile["moisture_range"]), 1)
    organic_matter = round(rng.uniform(*profile["om_range"]), 2)
    ec = round(rng.uniform(0.2, 1.8), 2)  # Electrical conductivity dS/m
    temp_c = round(rng.uniform(18, 34), 1)

    deficiencies = []
    if _classify_nutrient(n, "N") in ["Critical", "Deficient"]:
        deficiencies.append("Nitrogen")
    if _classify_nutrient(p, "P") in ["Critical", "Deficient"]:
        deficiencies.append("Phosphorus")
    if _classify_nutrient(k, "K") in ["Critical", "Deficient"]:
        deficiencies.append("Potassium")

    return {
        "soil_type": soil_type,
        "description": profile["desc"],
        "npk": {
            "N_kg_per_ha": n, "N_status": _classify_nutrient(n, "N"),
            "P_kg_per_ha": p, "P_status": _classify_nutrient(p, "P"),
            "K_kg_per_ha": k, "K_status": _classify_nutrient(k, "K"),
        },
        "ph": ph,
        "ph_status": _classify_ph(ph),
        "moisture_pct": moisture,
        "moisture_status": _classify_moisture(moisture),
        "organic_matter_pct": organic_matter,
        "ec_ds_per_m": ec,
        "soil_temp_c": temp_c,
        "deficiencies_detected": deficiencies,
        "fertility_score": round(
            (min(n / 280, 1) * 40) + (min(p / 25, 1) * 30) + (min(k / 280, 1) * 30), 1
        ),
    }
