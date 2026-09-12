"""
Market & Pricing Advisory Agent — provides sell/hold/diversify recommendation with MSP context.
"""
import json
import os
import time
from groq import Groq

SYSTEM_PROMPT = """You are a Market & Pricing Advisory Agent for KisanMitra AI — Indian mandi expert.

DECISION RULES:
- SELL_NOW: price >= MSP+5% AND trend rising/stable OR perishable crop
- HOLD: trend falling but seasonal recovery expected AND crop stores well
- DIVERSIFY_MARKET: local mandi >6% below best nearby net realisation
- Always compare spot vs MSP. Mention most relevant govt scheme.
- No speculation — data-backed reasoning only.
- Output ONLY valid JSON, no markdown."""

OUTPUT_SCHEMA = """{
  "recommended_action": "SELL_NOW|HOLD|DIVERSIFY_MARKET",
  "decision_reason": "2-3 sentences data-backed",
  "target_price_range": "Rs X-Y per quintal",
  "best_mandi_to_sell": "mandi name + net realisation",
  "msp_comparison": "how price compares to MSP",
  "hold_until": "date/condition or null",
  "government_scheme": "most relevant scheme",
  "price_trend_insight": "30-day trend summary",
  "caution": "storage risk or perishability note",
  "reasoning_factors": [{"factor":"name","value":"val","impact":"why"}]
}"""


def run(crop: str, market_data: dict, location: str = "india") -> dict:
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    model = os.environ.get("GROQ_MODEL", "qwen/qwen3.8-27b")

    # Compact nearby mandis
    nearby = []
    for m in market_data.get("nearby_mandis", [])[:3]:
        better = "BETTER" if m.get('advantage') else ""
        nearby.append(f"{m['mandi']}:Rs.{m['price']}/q net={m['net_realisation']} {better}")

    user_message = (
        f"CROP:{crop} | LOC:{location} | "
        f"SPOT:Rs.{market_data.get('spot_price')}/q | "
        f"MSP:Rs.{market_data.get('msp','N/A')} | "
        f"TREND:{market_data.get('trend')}({market_data.get('trend_pct',0):+.1f}%) | "
        f"YIELD:{market_data.get('estimated_yield_qtl_per_ha')}q/ha | "
        f"SCHEME:{market_data.get('relevant_scheme','N/A')}\n"
        f"NEARBY:{' | '.join(nearby)}\n"
        f"BEST_MANDI:{market_data.get('best_mandi',{}).get('mandi','?')} net=Rs.{market_data.get('best_mandi',{}).get('net_realisation','?')}\n"
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
                temperature=0.3,
                max_tokens=550,
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
    raise RuntimeError("Market advisory agent failed after retries")
