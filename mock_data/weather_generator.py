"""
Realistic mock weather data generator for Indian agricultural regions.
Uses seeded randomness so data is stable per location+date combo.
"""
import random
import math
from datetime import datetime, timedelta


REGION_PROFILES = {
    "punjab": {"temp_base": 28, "humidity_base": 65, "rain_prob": 0.25, "season_offset": 0},
    "maharashtra": {"temp_base": 32, "humidity_base": 70, "rain_prob": 0.35, "season_offset": 2},
    "uttar_pradesh": {"temp_base": 30, "humidity_base": 60, "rain_prob": 0.30, "season_offset": 1},
    "rajasthan": {"temp_base": 38, "humidity_base": 35, "rain_prob": 0.10, "season_offset": -1},
    "west_bengal": {"temp_base": 30, "humidity_base": 80, "rain_prob": 0.50, "season_offset": 3},
    "karnataka": {"temp_base": 28, "humidity_base": 68, "rain_prob": 0.40, "season_offset": 2},
    "madhya_pradesh": {"temp_base": 31, "humidity_base": 58, "rain_prob": 0.28, "season_offset": 1},
    "default": {"temp_base": 30, "humidity_base": 62, "rain_prob": 0.30, "season_offset": 0},
}

WEATHER_CONDITIONS = ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain", "Heavy Rain", "Thunderstorm", "Clear"]


def _get_seed(location: str, offset_days: int = 0) -> int:
    today = datetime.now()
    date_val = (today + timedelta(days=offset_days)).strftime("%Y%m%d")
    return hash(f"{location.lower()}{date_val}") % (2**32)


def _seasonal_factor(month: int, season_offset: int = 0) -> float:
    """Returns a seasonal temperature modifier based on Indian climate cycle."""
    # Peak summer around May-June (month 5-6), cool winter Dec-Jan
    peak_month = 5 + season_offset
    angle = (month - peak_month) * (2 * math.pi / 12)
    return math.cos(angle) * 4.5


def get_current_weather(location: str = "default") -> dict:
    profile = REGION_PROFILES.get(location.lower().replace(" ", "_"), REGION_PROFILES["default"])
    rng = random.Random(_get_seed(location))

    month = datetime.now().month
    seasonal = _seasonal_factor(month, profile["season_offset"])

    temp = round(profile["temp_base"] + seasonal + rng.uniform(-3, 5), 1)
    humidity = round(min(98, max(20, profile["humidity_base"] + rng.uniform(-10, 12))), 1)
    wind_speed = round(rng.uniform(4, 22), 1)
    uv_index = round(rng.uniform(4, 11) if 5 <= month <= 9 else rng.uniform(2, 7), 1)
    
    is_raining = rng.random() < profile["rain_prob"]
    rainfall_today = round(rng.uniform(5, 45), 1) if is_raining else 0.0
    
    condition_pool = ["Light Rain", "Heavy Rain"] if is_raining else ["Sunny", "Partly Cloudy", "Clear", "Cloudy"]
    condition = rng.choice(condition_pool)

    # ET0 (evapotranspiration) — Penman-Monteith simplified
    et0 = round((0.0023 * (temp + 17.8) * math.sqrt(abs(temp - 0)) * 0.4) + rng.uniform(0.5, 2.5), 2)

    return {
        "location": location,
        "temperature_c": temp,
        "feels_like_c": round(temp + (humidity - 60) * 0.08, 1),
        "humidity_pct": humidity,
        "wind_speed_kmh": wind_speed,
        "uv_index": uv_index,
        "condition": condition,
        "rainfall_today_mm": rainfall_today,
        "et0_mm_day": et0,
        "timestamp": datetime.now().isoformat(),
    }


def get_7day_forecast(location: str = "default") -> list:
    profile = REGION_PROFILES.get(location.lower().replace(" ", "_"), REGION_PROFILES["default"])
    forecast = []
    month = datetime.now().month

    for day in range(7):
        rng = random.Random(_get_seed(location, offset_days=day))
        seasonal = _seasonal_factor(month, profile["season_offset"])

        temp_max = round(profile["temp_base"] + seasonal + rng.uniform(0, 6), 1)
        temp_min = round(temp_max - rng.uniform(5, 12), 1)
        humidity = round(min(98, max(20, profile["humidity_base"] + rng.uniform(-8, 14))), 1)

        rain_chance = profile["rain_prob"] + rng.uniform(-0.1, 0.2)
        rain_chance = max(0.0, min(1.0, rain_chance))
        is_rain = rng.random() < rain_chance
        rainfall_mm = round(rng.uniform(3, 55), 1) if is_rain else 0.0

        condition_pool = ["Light Rain", "Heavy Rain"] if is_rain else ["Sunny", "Partly Cloudy", "Clear", "Cloudy"]
        condition = rng.choice(condition_pool)

        date_label = (datetime.now() + timedelta(days=day)).strftime("%a %d %b")

        forecast.append({
            "day": day,
            "date": date_label,
            "temp_max_c": temp_max,
            "temp_min_c": temp_min,
            "humidity_pct": humidity,
            "rainfall_mm": rainfall_mm,
            "condition": condition,
            "rain_probability_pct": round(rain_chance * 100),
        })

    return forecast


def get_weather_summary(location: str = "default") -> dict:
    current = get_current_weather(location)
    forecast = get_7day_forecast(location)
    total_forecast_rain = sum(d["rainfall_mm"] for d in forecast[:2])
    rain_warning = total_forecast_rain > 10

    return {
        "current": current,
        "forecast": forecast,
        "rain_warning_48h": rain_warning,
        "total_rain_48h_mm": round(total_forecast_rain, 1),
        "irrigation_blocked": rain_warning,
    }
