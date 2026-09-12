"""
Crop Advisory Agent — provides nutrient, fertilizer, and sustainable farming advice.
"""
import json
import os
import time
from groq import Groq

SYSTEM_PROMPT = """You are a Crop Advisory Agent for KisanMitra AI — expert agronomist for Indian farming.

RULES:
- Generic fertilizer names only (Urea, DAP, MOP, FYM, Vermicompost, Azotobacter, Trichoderma)
- Organic/bio options FIRST, chemical as supplement
- Exact dosage in kg/ha + timing + method
- pH<6: recommend lime; pH>8: recommend gypsum
- Always mention one crop rotation benefit
- Output ONLY valid JSON, no markdown."""

OUTPUT_SCHEMA = """{
  "growth_phase": "phase name",
  "soil_health_summary": "2 sentences on soil",
  "fertilizer_recommendation": "primary rec organic-first",
  "dosage": "exact kg/ha + timing + method",
  "organic_alternatives": "FYM/compost/bio options",
  "ph_correction": "lime/gypsum or pH optimal",
  "sustainability_tip": "crop rotation or intercropping tip",
  "caution": "warnings for this crop+soil",
  "reasoning_factors": [{"factor":"name","value":"val","impact":"why"}]
}"""


def run(crop: str, growth_stage: str, soil_data: dict) -> dict:
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    model = os.environ.get("GROQ_MODEL", "qwen/qwen3.8-27b")

    npk = soil_data.get('npk', {})
    user_message = (
        f"CROP:{crop} | STAGE:{growth_stage} | "
        f"N:{npk.get('N_kg_per_ha','?')}kg/ha({npk.get('N_status','?')}) | "
        f"P:{npk.get('P_kg_per_ha','?')}kg/ha({npk.get('P_status','?')}) | "
        f"K:{npk.get('K_kg_per_ha','?')}kg/ha({npk.get('K_status','?')}) | "
        f"pH:{soil_data.get('ph','?')}({soil_data.get('ph_status','?')}) | "
        f"MOISTURE:{soil_data.get('moisture_pct','?')}% | "
        f"OM:{soil_data.get('organic_matter_pct','?')}% | "
        f"TYPE:{soil_data.get('soil_type','?')} | "
        f"DEFICIENCIES:{','.join(soil_data.get('deficiencies_detected',[]) or ['none'])}\n"
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
                max_tokens=600,
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
    raise RuntimeError("Crop advisory agent failed after retries")
