"""
Weather & Irrigation Agent — provides IRRIGATE/DELAY/DRAIN decision with schedule.
"""
import json
import os
import time
from groq import Groq

SYSTEM_PROMPT = """You are a Weather & Irrigation Agent for KisanMitra AI.

DECISION RULES:
1. Rain >10mm in 48h → action="DELAY", warn about irrigation block
2. Soil moisture >75% → action="DRAIN"
3. Soil moisture <35% + no rain → action="IRRIGATE" with schedule (5-7 AM best)
4. Moisture 35-60%, mild weather → action="DELAY" (optimal)
5. Temp >38°C → evening/night irrigation only. Wind >20 km/h → delay sprinkler.

Output ONLY valid JSON, no markdown."""

OUTPUT_SCHEMA = """{
  "action": "IRRIGATE|DELAY|DRAIN",
  "decision_reason": "1-2 sentences",
  "schedule_hours": "start time, duration, interval or N/A",
  "water_requirement_mm": "estimated mm or N/A",
  "weather_alert": "rain/heat warning or No critical alert",
  "conservation_tip": "one water-saving tip",
  "caution": "field safety warning",
  "reasoning_factors": [{"factor":"name","value":"val","impact":"why"}]
}"""


def run(weather_data: dict, soil_moisture: float, crop: str = "general") -> dict:
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    model = os.environ.get("GROQ_MODEL", "qwen/qwen3.8-27b")

    current = weather_data.get("current", {})
    forecast = weather_data.get("forecast", [])
    rain_48h = weather_data.get("total_rain_48h_mm", 0)
    irrigation_blocked = weather_data.get("irrigation_blocked", False)

    # Compact forecast — only key numbers
    fc_lines = []
    for d in forecast[:4]:
        fc_lines.append(f"Day{d['day']+1}: {d['condition']}, {d['temp_max_c']}C, rain={d['rainfall_mm']}mm")
    forecast_compact = " | ".join(fc_lines)

    user_message = (
        f"CROP:{crop} | SOIL_MOISTURE:{soil_moisture}% | "
        f"TEMP:{current.get('temperature_c')}C | HUM:{current.get('humidity_pct')}% | "
        f"WIND:{current.get('wind_speed_kmh')}km/h | UV:{current.get('uv_index')} | "
        f"CONDITION:{current.get('condition')} | TODAY_RAIN:{current.get('rainfall_today_mm',0)}mm | "
        f"ET0:{current.get('et0_mm_day')}mm/day | RAIN_48H:{rain_48h}mm | "
        f"BLOCKED:{'YES' if irrigation_blocked else 'No'}\n"
        f"FORECAST:{forecast_compact}\n"
        f"Return JSON schema:\n{OUTPUT_SCHEMA}"
    )

    for attempt in range(3):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.2,
                max_tokens=512,
                response_format={"type": "json_object"},
            )
            raw = response.choices[0].message.content
            return json.loads(raw)
        except Exception as e:
            err = str(e)
            if "429" in err or "rate_limit" in err.lower():
                wait = (attempt + 1) * 3
                time.sleep(wait)
            else:
                raise
    raise RuntimeError("Irrigation agent failed after retries")
