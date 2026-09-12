"""
Pest & Disease Detection Agent — diagnoses crop health issues via image or text description.
"""
import json
import os
import time
import base64
from groq import Groq

SYSTEM_PROMPT = """You are a Pest & Disease Detection Agent for KisanMitra AI — expert Indian crop pathologist.

RULES:
- Confidence: High (clear symptoms), Medium (2 candidates), Low (ambiguous)
- Severity: Mild(<10%), Moderate(10-30%), Severe(>30%), Critical(>50%)
- 3-tier IPM: Cultural first, then Organic/Bio, Chemical LAST RESORT only
- For chemicals: give generic active ingredient + exact dilution + PHI (harvest wait days)
- Common crops: Rice(Blast,BPH), Wheat(Rust,Aphids), Cotton(Bollworm), Tomato(Blight,Wilt), Maize(FAW)
- Output ONLY valid JSON, no markdown."""

OUTPUT_SCHEMA = """{
  "primary_diagnosis": "pest or disease name",
  "secondary_diagnosis": "second candidate or null",
  "confidence": "High|Medium|Low",
  "severity": "Mild|Moderate|Severe|Critical",
  "ipm_tier1_cultural": "cultural control steps",
  "ipm_tier2_biological": "bio/organic treatment + dilution",
  "ipm_tier3_chemical": "active ingredient + dilution + method or Not required",
  "harvest_wait_days": "PHI days or N/A",
  "treatment_organic": "organic treatment summary",
  "treatment_chemical": "chemical summary or Not required",
  "caution": "safety gear, resistance warning",
  "reasoning_factors": [{"factor":"name","value":"observation","impact":"why"}]
}"""


def run(crop: str, symptoms_text: str, image_base64: str = None, image_mime: str = "image/jpeg") -> dict:
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    vision_model = os.environ.get("GROQ_VISION_MODEL", "qwen/qwen3.8-27b")
    text_model = os.environ.get("GROQ_MODEL", "qwen/qwen3.8-27b")

    user_text = (
        f"CROP:{crop} | SYMPTOMS:{symptoms_text or 'analyze from image only'}\n"
        f"Return JSON schema:\n{OUTPUT_SCHEMA}"
    )

    def call_with_retry(model, messages, max_tok=700):
        for attempt in range(3):
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.2,
                    max_tokens=max_tok,
                    response_format={"type": "json_object"},
                )
                return json.loads(response.choices[0].message.content)
            except Exception as e:
                err = str(e)
                if "429" in err or "rate_limit" in err.lower():
                    time.sleep((attempt + 1) * 3)
                else:
                    raise
        raise RuntimeError("Pest agent failed after retries")

    if image_base64:
        try:
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": [
                    {"type": "image_url", "image_url": {"url": f"data:{image_mime};base64,{image_base64}"}},
                    {"type": "text", "text": user_text},
                ]},
            ]
            result = call_with_retry(vision_model, messages)
            result["_diagnosis_method"] = "vision_model"
            return result
        except Exception:
            pass  # fall through to text-only

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_text},
    ]
    result = call_with_retry(text_model, messages)
    result["_diagnosis_method"] = "text_only"
    return result
