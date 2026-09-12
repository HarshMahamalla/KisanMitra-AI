"""
Realistic mock mandi market price generator for Indian crops.
Simulates spot price, nearby mandi prices, MSP, and 30-day trend.
"""
import random
import math
from datetime import datetime, timedelta


# Prices in ₹ per quintal (100 kg), MSP from recent GoI notifications
CROP_PROFILES = {
    "wheat": {
        "msp": 2275, "base_price": 2350, "volatility": 0.08,
        "season_peak_month": 4, "units": "₹/quintal"
    },
    "rice": {
        "msp": 2183, "base_price": 2250, "volatility": 0.07,
        "season_peak_month": 10, "units": "₹/quintal"
    },
    "maize": {
        "msp": 2090, "base_price": 2150, "volatility": 0.10,
        "season_peak_month": 10, "units": "₹/quintal"
    },
    "soybean": {
        "msp": 4600, "base_price": 4700, "volatility": 0.12,
        "season_peak_month": 11, "units": "₹/quintal"
    },
    "cotton": {
        "msp": 7020, "base_price": 7200, "volatility": 0.09,
        "season_peak_month": 11, "units": "₹/quintal"
    },
    "sugarcane": {
        "msp": 340, "base_price": 355, "volatility": 0.05,
        "season_peak_month": 1, "units": "₹/quintal"
    },
    "tomato": {
        "msp": None, "base_price": 1800, "volatility": 0.35,
        "season_peak_month": 12, "units": "₹/quintal"
    },
    "onion": {
        "msp": None, "base_price": 1600, "volatility": 0.40,
        "season_peak_month": 2, "units": "₹/quintal"
    },
    "potato": {
        "msp": None, "base_price": 900, "volatility": 0.30,
        "season_peak_month": 3, "units": "₹/quintal"
    },
    "mustard": {
        "msp": 5650, "base_price": 5800, "volatility": 0.08,
        "season_peak_month": 4, "units": "₹/quintal"
    },
    "chickpea": {
        "msp": 5440, "base_price": 5600, "volatility": 0.09,
        "season_peak_month": 3, "units": "₹/quintal"
    },
    "groundnut": {
        "msp": 6783, "base_price": 7000, "volatility": 0.11,
        "season_peak_month": 10, "units": "₹/quintal"
    },
    "default": {
        "msp": 2000, "base_price": 2100, "volatility": 0.10,
        "season_peak_month": 6, "units": "₹/quintal"
    },
}

MANDI_NAMES = [
    "Azadpur Mandi (Delhi)", "Vashi APMC (Mumbai)", "Yeshwanthpur APMC (Bengaluru)",
    "Ghazipur Mandi (UP)", "Koyambedu (Chennai)", "Pune APMC", "Nagpur APMC",
    "Amritsar Grain Market", "Ludhiana Grain Market", "Indore Mandi",
    "Bhopal Sabzi Mandi", "Jaipur APMC", "Chandigarh Grain Mkt",
    "Kolkata Koley Market", "Hyderabad APMC"
]

SCHEMES = [
    "PM-KISAN Samman Nidhi (₹6,000/year direct transfer)",
    "PM Fasal Bima Yojana — crop insurance at subsidized premium",
    "e-NAM (National Agriculture Market) — sell across states online",
    "Kisan Credit Card (KCC) — low-interest crop loans",
    "PMKSY — Pradhan Mantri Krishi Sinchayee Yojana (irrigation subsidy)",
    "Soil Health Card Scheme — free soil testing every 2 years",
    "Rashtriya Krishi Vikas Yojana (RKVY) — infrastructure grants",
]


def _get_seed(crop: str, location: str, offset_days: int = 0) -> int:
    today = (datetime.now() + timedelta(days=offset_days)).strftime("%Y%m%d")
    return hash(f"{crop}{location}{today}") % (2**32)


def _seasonal_price_factor(base_price: float, season_peak_month: int, month: int, volatility: float) -> float:
    """Prices typically peak near harvest, trough at glut."""
    angle = (month - season_peak_month) * (2 * math.pi / 12)
    seasonal_shift = math.sin(angle) * volatility * base_price * 0.5
    return seasonal_shift


def get_market_data(crop: str = "wheat", location: str = "punjab") -> dict:
    profile = CROP_PROFILES.get(crop.lower(), CROP_PROFILES["default"])
    rng = random.Random(_get_seed(crop, location))
    month = datetime.now().month

    seasonal = _seasonal_price_factor(profile["base_price"], profile["season_peak_month"], month, profile["volatility"])
    spot_price = round(profile["base_price"] + seasonal + rng.uniform(
        -profile["base_price"] * profile["volatility"] * 0.4,
         profile["base_price"] * profile["volatility"] * 0.4
    ))

    # Nearby mandi prices (3–5 mandis)
    num_mandis = rng.randint(3, 5)
    nearby_mandis_pool = rng.sample(MANDI_NAMES, num_mandis)
    nearby_mandis = []
    for mandi in nearby_mandis_pool:
        mandi_rng = random.Random(hash(f"{mandi}{crop}{datetime.now().strftime('%Y%m%d')}") % (2**32))
        mandi_price = round(spot_price + mandi_rng.uniform(-spot_price * 0.06, spot_price * 0.08))
        transport_cost = round(mandi_rng.uniform(80, 250))
        net_price = mandi_price - transport_cost
        nearby_mandis.append({
            "mandi": mandi,
            "price": mandi_price,
            "transport_cost_per_q": transport_cost,
            "net_realisation": net_price,
            "advantage": net_price > spot_price,
        })

    nearby_mandis.sort(key=lambda x: x["net_realisation"], reverse=True)

    # 30-day historical trend
    historical = []
    for d in range(29, -1, -1):
        h_rng = random.Random(_get_seed(crop, location, offset_days=-d))
        h_seasonal = _seasonal_price_factor(
            profile["base_price"], profile["season_peak_month"],
            (datetime.now() - timedelta(days=d)).month, profile["volatility"]
        )
        h_price = round(profile["base_price"] + h_seasonal + h_rng.uniform(
            -profile["base_price"] * profile["volatility"] * 0.3,
             profile["base_price"] * profile["volatility"] * 0.3
        ))
        historical.append({
            "date": (datetime.now() - timedelta(days=d)).strftime("%d %b"),
            "price": h_price
        })

    # Trend direction
    avg_last7 = sum(d["price"] for d in historical[-7:]) / 7
    avg_prev7 = sum(d["price"] for d in historical[-14:-7]) / 7
    trend = "rising" if avg_last7 > avg_prev7 * 1.01 else ("falling" if avg_last7 < avg_prev7 * 0.99 else "stable")
    trend_pct = round(((avg_last7 - avg_prev7) / avg_prev7) * 100, 2)

    # MSP comparison
    msp = profile.get("msp")
    msp_note = None
    if msp:
        if spot_price < msp:
            msp_note = f"ALERT: Current price (₹{spot_price}) is BELOW MSP (₹{msp}). Contact nearest APMC/FCI procurement centre."
        else:
            msp_note = f"Price (₹{spot_price}) is ₹{spot_price - msp} above MSP (₹{msp}). Good market conditions."

    # Yield estimate and value
    yield_qtl_per_ha = round(rng.uniform(18, 45), 1)
    gross_value = round(spot_price * yield_qtl_per_ha)

    relevant_scheme = rng.choice(SCHEMES)

    return {
        "crop": crop,
        "location": location,
        "spot_price": spot_price,
        "msp": msp,
        "msp_note": msp_note,
        "units": profile["units"],
        "trend": trend,
        "trend_pct": trend_pct,
        "price_30d_history": historical,
        "nearby_mandis": nearby_mandis,
        "best_mandi": nearby_mandis[0] if nearby_mandis else None,
        "estimated_yield_qtl_per_ha": yield_qtl_per_ha,
        "estimated_gross_value_inr": gross_value,
        "relevant_scheme": relevant_scheme,
        "timestamp": datetime.now().isoformat(),
    }
