"""
KisanMitra AI â€” Flask Backend v2
Multi-Agent Farming Advisory System
New in v2: parallel agents, SSE streaming, farm health score, seasonal calendar
"""
import os
import json
import base64
import time
import uuid
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from flask import Flask, request, jsonify, session, Response, stream_with_context
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

# â”€â”€ App Setup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "kisanmitra-dev-secret-change-this")
app.config["SESSION_TYPE"] = "filesystem"
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10MB

CORS(app, supports_credentials=True, origins=[
    "http://localhost:5173", "http://127.0.0.1:5173"
])

# â”€â”€ Service Imports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
from services import orchestrator_agent, crop_advisory_agent, weather_irrigation_agent
from services import pest_detection_agent, market_advisory_agent
from mock_data import weather_generator, soil_generator, market_generator, seasonal_calendar

# â”€â”€ In-memory store â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
advisory_history = []
farmer_profiles  = {}

_executor = ThreadPoolExecutor(max_workers=4)


# â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
def _session_id():
    if "sid" not in session:
        session["sid"] = str(uuid.uuid4())
    return session["sid"]


def _error(msg: str, code: int = 500, details: str = None):
    payload = {"error": msg}
    if details:
        payload["details"] = details
    return jsonify(payload), code


def _detect_intent(query: str) -> list:
    q = query.lower()
    intents = []
    if any(k in q for k in ["fertilizer","soil","nutrient","seed","growth","sow","à¤–à¤¾à¤¦","à¤¬à¥€à¤œ","à¤®à¤¿à¤Ÿà¥à¤Ÿà¥€","à¤«à¤¸à¤²"]):
        intents.append("CROP_ADVISORY")
    if any(k in q for k in ["water","irrigat","rain","drought","dry","à¤ªà¤¾à¤¨à¥€","à¤¸à¤¿à¤‚à¤šà¤¾à¤ˆ","à¤¬à¤¾à¤°à¤¿à¤¶","à¤¸à¥‚à¤–à¤¾"]):
        intents.append("IRRIGATION")
    if any(k in q for k in ["pest","disease","insect","wilt","spot","yellow","blight","à¤•à¥€à¤¡à¤¼à¤¾","à¤¬à¥€à¤®à¤¾à¤°à¥€","à¤ªà¤¤à¥à¤¤à¥€"]):
        intents.append("PEST_DISEASE")
    if any(k in q for k in ["price","sell","mandi","market","msp","profit","à¤¦à¤¾à¤®","à¤®à¤‚à¤¡à¥€","à¤¬à¥‡à¤šà¤¨à¤¾","à¤­à¤¾à¤µ"]):
        intents.append("MARKET_PRICING")
    if not intents:
        intents = ["CROP_ADVISORY", "IRRIGATION", "MARKET_PRICING"]
    return intents


def _compute_farm_health_score(
    soil_data: dict,
    irrigation_result: dict,
    pest_result: dict,
    market_result: dict,
) -> dict:
    """
    Composite 0-100 farm health score.
    Weights (documented):
      Soil fertility score  : 35 pts  (from soil_generator fertility_score 0-100)
      Irrigation status     : 25 pts  (DELAY-optimal=25, IRRIGATE=15, DRAIN=5)
      Pest risk             : 25 pts  (None=25, Mild=20, Moderate=12, Severe=4, Critical=0)
      Market timing         : 15 pts  (SELL_NOW=15, HOLD=10, DIVERSIFY=12, None=8)
    """
    # -- Soil (35 pts) --
    fertility = soil_data.get("fertility_score", 50)  # already 0-100
    soil_pts = round(fertility * 0.35)

    # -- Irrigation (25 pts) --
    irr_action = (irrigation_result or {}).get("action", "")
    irr_pts = {"DELAY": 25, "IRRIGATE": 15, "DRAIN": 5}.get(irr_action, 18)

    # -- Pest risk (25 pts) --
    severity = (pest_result or {}).get("severity", "")
    pest_pts = {"Mild": 20, "Moderate": 12, "Severe": 4, "Critical": 0}.get(severity, 23)

    # -- Market timing (15 pts) --
    mkt_action = (market_result or {}).get("recommended_action", "")
    mkt_pts = {"SELL_NOW": 15, "DIVERSIFY_MARKET": 12, "HOLD": 10}.get(mkt_action, 8)

    total = soil_pts + irr_pts + pest_pts + mkt_pts
    total = min(100, max(0, total))

    grade = "Excellent" if total >= 80 else "Good" if total >= 60 else "Fair" if total >= 40 else "Poor"
    grade_hi = {"Excellent": "à¤‰à¤¤à¥à¤•à¥ƒà¤·à¥à¤Ÿ", "Good": "à¤…à¤šà¥à¤›à¤¾", "Fair": "à¤ à¥€à¤•-à¤ à¤¾à¤•", "Poor": "à¤•à¤®à¤œà¤¼à¥‹à¤°"}[grade]
    color = "green" if total >= 70 else "amber" if total >= 40 else "red"

    return {
        "score": total,
        "grade": grade,
        "grade_hi": grade_hi,
        "color": color,
        "breakdown": {
            "soil_pts": soil_pts,
            "irrigation_pts": irr_pts,
            "pest_pts": pest_pts,
            "market_pts": mkt_pts,
        },
    }


def _run_agents_parallel(intents, crop, growth_stage, soil_data, weather_data, market_data):
    """Run all needed specialist agents concurrently using ThreadPoolExecutor."""
    futures = {}
    errors  = {}

    def safe(fn, *args):
        try:
            return fn(*args)
        except Exception as e:
            raise e

    if "CROP_ADVISORY" in intents:
        futures["crop"] = _executor.submit(safe, crop_advisory_agent.run, crop, growth_stage, soil_data)
    if "IRRIGATION" in intents:
        futures["irrigation"] = _executor.submit(safe, weather_irrigation_agent.run,
                                                  weather_data, soil_data.get("moisture_pct", 45), crop)
    if "MARKET_PRICING" in intents:
        futures["market"] = _executor.submit(safe, market_advisory_agent.run, crop, market_data,
                                              soil_data.get("soil_type", "india"))

    results = {"crop": None, "irrigation": None, "pest": None, "market": None}
    for key, fut in futures.items():
        try:
            results[key] = fut.result(timeout=60)
        except Exception as e:
            errors[key] = str(e)[:120]

    return results, errors


def _build_advisory_response(query, profile, results, errors, weather_data, soil_data, market_data, intents):
    """Synthesize everything into the final advisory payload."""
    health_score = _compute_farm_health_score(
        soil_data, results["irrigation"], results["pest"], results["market"]
    )

    final = orchestrator_agent.run(
        farmer_query=query,
        farmer_profile=profile,
        crop_advisory_result=results["crop"],
        irrigation_result=results["irrigation"],
        pest_result=results["pest"],
        market_result=results["market"],
    )

    # Pass reasoning_factors through from sub-agents
    final["reasoning_factors"] = {
        "crop":   (results["crop"]   or {}).get("reasoning_factors", []),
        "irrigation": (results["irrigation"] or {}).get("reasoning_factors", []),
        "pest":   (results["pest"]   or {}).get("reasoning_factors", []),
        "market": (results["market"] or {}).get("reasoning_factors", []),
    }

    final["farm_health_score"] = health_score
    final["_meta"] = {
        "intents_detected": intents,
        "agents_called": [k for k, v in results.items() if v is not None],
        "sub_agent_errors": errors,
        "weather_snapshot": {
            "temp": weather_data["current"].get("temperature_c"),
            "condition": weather_data["current"].get("condition"),
            "rain_warning": weather_data.get("rain_warning_48h"),
        },
        "market_snapshot": {
            "spot_price": market_data.get("spot_price"),
            "trend": market_data.get("trend"),
        },
        "timestamp": datetime.now().isoformat(),
    }
    return final


# â”€â”€ Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "KisanMitra AI Backend",
        "version": "2.0.0",
        "groq_configured": bool(os.environ.get("GROQ_API_KEY")),
        "model": os.environ.get("GROQ_MODEL", "qwen/qwen3.8-27b"),
        "timestamp": datetime.now().isoformat(),
    })


@app.route("/api/farmer-profile", methods=["POST"])
def save_farmer_profile():
    data = request.get_json(silent=True)
    if not data:
        return _error("Invalid JSON body", 400)
    for field in ["crop", "location"]:
        if not data.get(field):
            return _error(f"Missing required field: {field}", 400)

    sid = _session_id()
    profile = {
        "name":             str(data.get("name", "Kisan"))[:80],
        "location":         str(data.get("location", "India"))[:100],
        "land_size":        str(data.get("land_size", "1"))[:20],
        "soil_type":        str(data.get("soil_type", "loamy"))[:50],
        "crop":             str(data.get("crop", "wheat"))[:50],
        "growth_stage":     str(data.get("growth_stage", "vegetative"))[:50],
        "irrigation_source":str(data.get("irrigation_source", "canal"))[:60],
        "language":         str(data.get("language", "Hindi"))[:20],
    }
    farmer_profiles[sid] = profile
    session["farmer_profile"] = profile
    return jsonify({"status": "saved", "profile": profile, "session_id": sid})


@app.route("/api/advisory", methods=["POST"])
def get_advisory():
    """Standard (non-streaming) advisory endpoint â€” returns complete JSON."""
    if not os.environ.get("GROQ_API_KEY"):
        return _error("GROQ_API_KEY is not configured. Please add it to your .env file.", 503)

    data = request.get_json(silent=True)
    if not data:
        return _error("Invalid JSON body", 400)

    query = str(data.get("query", "")).strip()
    if not query:
        return _error("Query is required", 400)
    if len(query) > 2000:
        return _error("Query too long (max 2000 characters)", 400)

    sid     = _session_id()
    profile = farmer_profiles.get(sid) or session.get("farmer_profile") or {
        "name": "Kisan", "location": "india", "land_size": "1",
        "soil_type": "loamy", "crop": data.get("crop", "wheat"),
        "growth_stage": "vegetative", "irrigation_source": "canal", "language": "Hindi"
    }

    crop         = profile.get("crop", "wheat")
    location     = profile.get("location", "india")
    soil_type    = profile.get("soil_type", "loamy")
    growth_stage = profile.get("growth_stage", "vegetative")

    weather_data = weather_generator.get_weather_summary(location)
    soil_data    = soil_generator.get_soil_data(soil_type, location)
    market_data  = market_generator.get_market_data(crop, location)

    intents = _detect_intent(query)
    results, errors = _run_agents_parallel(intents, crop, growth_stage, soil_data, weather_data, market_data)

    try:
        final = _build_advisory_response(query, profile, results, errors, weather_data, soil_data, market_data, intents)
    except Exception as e:
        return _error("KisanMitra AI is temporarily unavailable. Please try again.", 503, details=str(e)[:200])

    # History
    advisory_history.append({
        "id": len(advisory_history) + 1,
        "query": query, "crop": crop, "location": location,
        "timestamp": datetime.now().isoformat(),
        "summary": final.get("summary", "Advisory generated"),
        "summary_hi": final.get("summary_hi", ""),
        "intents": intents,
        "farm_health_score": final.get("farm_health_score", {}).get("score"),
    })
    if len(advisory_history) > 50:
        advisory_history.pop(0)

    return jsonify(final)


@app.route("/api/advisory/stream", methods=["POST"])
def get_advisory_stream():
    """
    SSE streaming advisory endpoint.
    Sends a sequence of SSE events:
      event: intent       â€” immediately after intent classification
      event: agent_done   â€” each time a specialist agent finishes (4 total)
      event: health_score â€” computed health score
      event: token        â€” orchestrator summary tokens streamed word-by-word
      event: complete     â€” final complete JSON payload
      event: error        â€” on failure
    """
    if not os.environ.get("GROQ_API_KEY"):
        def err_gen():
            yield "event: error\ndata: " + json.dumps({"error": "GROQ_API_KEY not configured"}) + "\n\n"
        return Response(stream_with_context(err_gen()), mimetype="text/event-stream")

    data = request.get_json(silent=True) or {}
    query = str(data.get("query", "")).strip()
    if not query or len(query) > 2000:
        def err_gen():
            yield "event: error\ndata: " + json.dumps({"error": "Invalid query"}) + "\n\n"
        return Response(stream_with_context(err_gen()), mimetype="text/event-stream")

    sid     = _session_id()
    profile = farmer_profiles.get(sid) or session.get("farmer_profile") or {
        "name": "Kisan", "location": "india", "land_size": "1",
        "soil_type": "loamy", "crop": data.get("crop", "wheat"),
        "growth_stage": "vegetative", "irrigation_source": "canal", "language": "Hindi"
    }

    crop         = profile.get("crop", "wheat")
    location     = profile.get("location", "india")
    soil_type    = profile.get("soil_type", "loamy")
    growth_stage = profile.get("growth_stage", "vegetative")

    def generate():
        try:
            # 1. Load mock data
            weather_data = weather_generator.get_weather_summary(location)
            soil_data    = soil_generator.get_soil_data(soil_type, location)
            market_data  = market_generator.get_market_data(crop, location)

            # 2. Detect intent and send immediately
            intents = _detect_intent(query)
            yield f"event: intent\ndata: {json.dumps({'intents': intents, 'query': query})}\n\n"

            # 3. Launch all specialist agents in parallel
            agent_futures = {}
            if "CROP_ADVISORY" in intents:
                agent_futures["crop"] = _executor.submit(crop_advisory_agent.run, crop, growth_stage, soil_data)
            if "IRRIGATION" in intents:
                agent_futures["irrigation"] = _executor.submit(
                    weather_irrigation_agent.run, weather_data, soil_data.get("moisture_pct", 45), crop)
            if "MARKET_PRICING" in intents:
                agent_futures["market"] = _executor.submit(
                    market_advisory_agent.run, crop, market_data, location)

            results  = {"crop": None, "irrigation": None, "pest": None, "market": None}
            errors   = {}

            # 4. Stream each agent result as it completes
            done_futures = {v: k for k, v in agent_futures.items()}
            for fut in as_completed(agent_futures.values(), timeout=90):
                key = done_futures[fut]
                try:
                    results[key] = fut.result()
                    yield f"event: agent_done\ndata: {json.dumps({'agent': key, 'result': results[key]})}\n\n"
                except Exception as e:
                    errors[key] = str(e)[:120]
                    yield f"event: agent_done\ndata: {json.dumps({'agent': key, 'error': errors[key]})}\n\n"

            # 5. Health score
            health_score = _compute_farm_health_score(soil_data, results["irrigation"], results["pest"], results["market"])
            yield f"event: health_score\ndata: {json.dumps(health_score)}\n\n"

            # 6. Orchestrator â€” stream summary sentence token by token using Groq streaming
            from groq import Groq
            import re

            client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
            model  = os.environ.get("GROQ_MODEL", "qwen/qwen3.8-27b")

            sub_ctx = ""
            for agent_key, res in results.items():
                if res:
                    sub_ctx += f"\n\n{agent_key.upper()} AGENT OUTPUT:\n{json.dumps(res, ensure_ascii=False)}"

            stream_resp = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": orchestrator_agent.SYSTEM_PROMPT},
                    {"role": "user", "content": (
                        f'FARMER\'S QUERY: "{query}"\n\nFARMER PROFILE:\n'
                        f'- Name: {profile.get("name")}\n'
                        f'- Crop: {profile.get("crop")}\n'
                        f'- Location: {profile.get("location")}\n'
                        f'- Soil Type: {profile.get("soil_type")}\n'
                        f'- Growth Stage: {profile.get("growth_stage")}\n'
                        f'\nSUB-AGENT RESULTS:{sub_ctx if sub_ctx else " No sub-agent data."}\n\n'
                        f'Synthesize into the complete JSON response format.'
                    )},
                ],
                temperature=0.4,
                max_tokens=2048,
                stream=True,
            )

            full_text = ""
            for chunk in stream_resp:
                token = chunk.choices[0].delta.content or ""
                if token:
                    full_text += token
                    yield f"event: token\ndata: {json.dumps({'token': token})}\n\n"

            # 7. Parse final JSON and send complete event
            try:
                # Extract JSON from streamed text
                match = re.search(r'\{.*\}', full_text, re.DOTALL)
                final = json.loads(match.group() if match else full_text)
            except Exception:
                final = {"summary": "Advisory generated. See agent results above.", "summary_hi": "à¤¸à¤²à¤¾à¤¹ à¤¤à¥ˆà¤¯à¤¾à¤° à¤¹à¥ˆà¥¤"}

            final["reasoning_factors"] = {
                k: (results[k] or {}).get("reasoning_factors", []) for k in results
            }
            final["farm_health_score"] = health_score
            final["_meta"] = {
                "intents_detected": intents,
                "agents_called": [k for k, v in results.items() if v],
                "sub_agent_errors": errors,
                "weather_snapshot": {
                    "temp": weather_data["current"].get("temperature_c"),
                    "condition": weather_data["current"].get("condition"),
                    "rain_warning": weather_data.get("rain_warning_48h"),
                },
                "market_snapshot": {"spot_price": market_data.get("spot_price"), "trend": market_data.get("trend")},
                "timestamp": datetime.now().isoformat(),
            }

            advisory_history.append({
                "id": len(advisory_history) + 1,
                "query": query, "crop": crop, "location": location,
                "timestamp": datetime.now().isoformat(),
                "summary": final.get("summary", ""),
                "summary_hi": final.get("summary_hi", ""),
                "intents": intents,
                "farm_health_score": health_score.get("score"),
            })
            if len(advisory_history) > 50:
                advisory_history.pop(0)

            yield f"event: complete\ndata: {json.dumps(final, ensure_ascii=False)}\n\n"

        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'error': str(e)[:300]})}\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )


@app.route("/api/pest-scan", methods=["POST"])
def pest_scan():
    if not os.environ.get("GROQ_API_KEY"):
        return _error("GROQ_API_KEY is not configured.", 503)

    crop = "unknown"; symptoms = ""; image_b64 = None; image_mime = "image/jpeg"

    if request.content_type and "multipart/form-data" in request.content_type:
        crop     = request.form.get("crop", "unknown")[:50]
        symptoms = request.form.get("symptoms", "")[:1000]
        file = request.files.get("image")
        if file:
            image_b64  = base64.b64encode(file.read(5 * 1024 * 1024)).decode("utf-8")
            image_mime = file.content_type or "image/jpeg"
    else:
        body     = request.get_json(silent=True) or {}
        crop     = str(body.get("crop", "unknown"))[:50]
        symptoms = str(body.get("symptoms", ""))[:1000]
        image_b64 = body.get("image_base64")

    if not symptoms and not image_b64:
        return _error("Provide either symptom description or an image for diagnosis.", 400)

    try:
        result = pest_detection_agent.run(crop, symptoms, image_b64, image_mime)
        result["_meta"] = {"timestamp": datetime.now().isoformat(), "crop": crop}
        return jsonify(result)
    except Exception as e:
        return _error("Pest detection failed. Please describe the symptoms in text.", 503, details=str(e)[:200])


@app.route("/api/mock/weather", methods=["GET"])
def mock_weather():
    return jsonify(weather_generator.get_weather_summary(request.args.get("location", "punjab")[:50]))


@app.route("/api/mock/market", methods=["GET"])
def mock_market():
    return jsonify(market_generator.get_market_data(
        request.args.get("crop", "wheat")[:30],
        request.args.get("location", "punjab")[:50]
    ))


@app.route("/api/mock/soil", methods=["GET"])
def mock_soil():
    return jsonify(soil_generator.get_soil_data(
        request.args.get("soil_type", "loamy")[:30],
        request.args.get("location", "india")[:50]
    ))


@app.route("/api/mock/calendar", methods=["GET"])
def mock_calendar():
    crop = request.args.get("crop", "wheat")[:30]
    return jsonify(seasonal_calendar.get_crop_calendar(crop))


@app.route("/api/history", methods=["GET"])
def get_history():
    return jsonify({"history": advisory_history[-20:]})


@app.route("/api/history", methods=["DELETE"])
def clear_history():
    advisory_history.clear()
    return jsonify({"status": "cleared"})


# â”€â”€ Error Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Route not found", "path": request.path}), 404

@app.errorhandler(413)
def too_large(e):
    return jsonify({"error": "File too large. Maximum upload size is 10MB."}), 413

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error. Please try again."}), 500


# â”€â”€ Init â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
if __name__ == "__main__":
    port  = int(os.environ.get("FLASK_PORT", 5000))
    debug = os.environ.get("FLASK_ENV", "development") == "development"
    print(f"ðŸŒ¾ KisanMitra AI Backend v2.0 starting on port {port}")
    print(f"   GROQ_API_KEY: {'âœ“ Configured' if os.environ.get('GROQ_API_KEY') else 'âœ— MISSING'}")
    print(f"   Parallel agents: ThreadPoolExecutor(max_workers=4)")
    print(f"   Streaming: /api/advisory/stream (SSE)")
    app.run(host="0.0.0.0", port=port, debug=debug)
