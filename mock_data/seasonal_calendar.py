"""
Seasonal crop calendar generator.
Returns sowing window, growth stages, and harvest window per crop.
All dates are approximate month-based ranges used for demonstration.
"""
from datetime import datetime, date

# Each entry: list of (label, start_month, end_month, color_class, description)
CROP_CALENDAR = {
    "wheat": [
        ("Soil Prep",     10, 10, "earth",  "Deep ploughing, FYM application"),
        ("Sowing",        11, 11, "kisan",  "Optimal sowing window for timely varieties"),
        ("Vegetative",    12,  1, "kisan",  "Irrigation, N top-dressing at tillering"),
        ("Flowering",      2,  2, "amber",  "Frost risk — protect crop; no heavy irrigation"),
        ("Grain Fill",     3,  3, "amber",  "Potassium foliar spray; watch for rust"),
        ("Harvest",        4,  4, "gold",   "Harvest when grains reach 12–14% moisture"),
        ("Post-Harvest",   5,  5, "gray",   "Residue management; summer ploughing"),
    ],
    "rice": [
        ("Nursery",        5,  6, "kisan",  "Seed treatment; raise nursery for 25–30 days"),
        ("Transplanting",  6,  7, "kisan",  "Transplant 2–3 seedlings per hill; 20×15 cm spacing"),
        ("Vegetative",     7,  8, "kisan",  "Heavy irrigation, weed control, N split doses"),
        ("Panicle Init.",  8,  8, "amber",  "Critical water stress period — maintain flood"),
        ("Flowering",      9,  9, "amber",  "Watch for blast and BPH; no water stress"),
        ("Maturity",      10, 10, "gold",   "Drain field 10 days before harvest"),
        ("Harvest",       10, 11, "gold",   "Combine at 20–22% grain moisture"),
    ],
    "maize": [
        ("Land Prep",      5,  5, "earth",  "Ridges and furrows; well-drained field"),
        ("Sowing",         6,  6, "kisan",  "Seed treatment with Thiram; 60×25 cm spacing"),
        ("Vegetative",     6,  8, "kisan",  "3 irrigations; earthing-up at knee height"),
        ("Tasseling",      8,  8, "amber",  "Critical period: protect from Fall Armyworm"),
        ("Grain Fill",     9,  9, "amber",  "Foliar micronutrients; watch stem borer"),
        ("Harvest",        9, 10, "gold",   "Harvest at black-layer formation"),
    ],
    "cotton": [
        ("Land Prep",      4,  4, "earth",  "Deep ploughing; apply FYM"),
        ("Sowing",         5,  6, "kisan",  "BG-II seed; 90×60 cm spacing"),
        ("Vegetative",     6,  7, "kisan",  "Topping at 8-node stage; N side-dressing"),
        ("Flowering",      7,  9, "amber",  "Watch bollworm; Bt spray if needed"),
        ("Boll Dev.",       9, 10, "amber",  "Defoliation for uniform opening"),
        ("Harvest",       10, 12, "gold",   "3–4 pickings; moisture < 8%"),
    ],
    "soybean": [
        ("Sowing",         6,  7, "kisan",  "Rhizobium inoculation; 45×5 cm spacing"),
        ("Vegetative",     7,  8, "kisan",  "2 inter-culturing; watch yellow mosaic"),
        ("Flowering",      8,  8, "amber",  "No water stress at R1–R2 stage"),
        ("Pod Fill",       8,  9, "amber",  "Foliar boron; watch girdle beetle"),
        ("Harvest",        9, 10, "gold",   "When 95% pods turn yellow-brown"),
    ],
    "mustard": [
        ("Sowing",        10, 10, "kisan",  "Line sowing; 45×15 cm; 5 kg seed/ha"),
        ("Vegetative",    10, 12, "kisan",  "Thinning at 15 days; N basal dose"),
        ("Flowering",     12,  1, "amber",  "Pollination period; no spraying"),
        ("Pod Fill",       1,  2, "amber",  "Watch aphids; spray if >10 per plant"),
        ("Harvest",        2,  3, "gold",   "Harvest at 80% pods straw-yellow"),
    ],
    "tomato": [
        ("Nursery",        6,  6, "kisan",  "Raise nursery 25–30 days"),
        ("Transplanting",  7,  7, "kisan",  "60×45 cm; evening transplanting"),
        ("Vegetative",     7,  8, "kisan",  "Stake at 30 cm; pinch suckers"),
        ("Flowering",      8,  9, "amber",  "Watch early blight and fruit borer"),
        ("Fruiting",       9, 10, "amber",  "Foliar CaNO3; drip if possible"),
        ("Harvest",       10, 12, "gold",   "Pick at breaker stage for transport"),
    ],
    "potato": [
        ("Land Prep",     10, 10, "earth",  "Well-tilled, loose soil; ridges 60 cm"),
        ("Planting",      10, 11, "kisan",  "Certified seed tubers; 60×20 cm"),
        ("Vegetative",    11, 12, "kisan",  "Earth up twice; watch late blight"),
        ("Tuber Init.",   12,  1, "amber",  "Critical irrigation; K top-dressing"),
        ("Maturity",       1,  2, "amber",  "Stop irrigation 10 days before harvest"),
        ("Harvest",        2,  3, "gold",   "Harvest at vine senescence"),
    ],
    "chickpea": [
        ("Sowing",        10, 11, "kisan",  "Rhizobium seed treatment; 30×10 cm"),
        ("Vegetative",    11, 12, "kisan",  "Minimal irrigation; weed control"),
        ("Flowering",     12,  1, "amber",  "Watch pod borer; pheromone traps"),
        ("Pod Fill",       1,  2, "amber",  "One protective spray if >5% damage"),
        ("Harvest",        2,  3, "gold",   "Harvest at 80% pod maturity"),
    ],
    "groundnut": [
        ("Land Prep",      5,  5, "earth",  "Sandy-loam; add gypsum 500 kg/ha"),
        ("Sowing",         6,  6, "kisan",  "Shelled seeds; 30×10 cm; 100 kg/ha"),
        ("Pegging",        7,  8, "kisan",  "Earthing-up for peg entry; no drought"),
        ("Pod Dev.",        8,  9, "amber",  "Watch tikka leaf spot; Chlorothalonil if needed"),
        ("Harvest",       10, 10, "gold",   "Harvest at 70–75% pod maturity"),
    ],
    "sugarcane": [
        ("Planting",      10, 12, "kisan",  "Two-bud setts; furrow planting"),
        ("Germination",   11,  1, "kisan",  "Gap filling at 30 days"),
        ("Tillering",      1,  4, "kisan",  "N split doses; trash mulching"),
        ("Grand Growth",   4,  9, "amber",  "Watch early shoot borer; propping at 8 months"),
        ("Maturity",       9, 12, "amber",  "Stop N after 10 months; check Brix"),
        ("Harvest",       11,  3, "gold",   "Harvest at 10–12 months; Brix > 18"),
    ],
    "onion": [
        ("Nursery",        9, 10, "kisan",  "Raised bed nursery; 5–6 weeks"),
        ("Transplanting", 10, 11, "kisan",  "15×10 cm; evening planting"),
        ("Vegetative",    11,  1, "kisan",  "N side-dressing; watch thrips"),
        ("Bulb Dev.",       1,  2, "amber",  "Reduce irrigation; K top-dressing"),
        ("Harvest",        2,  3, "gold",   "Harvest when 50% necks fall"),
    ],
    "default": [
        ("Soil Prep",      1,  2, "earth",  "Land preparation and FYM application"),
        ("Sowing",         3,  3, "kisan",  "Seed treatment and sowing"),
        ("Vegetative",     4,  6, "kisan",  "Fertilizer and irrigation management"),
        ("Flowering",      7,  8, "amber",  "Pest and disease monitoring"),
        ("Harvest",        9, 10, "gold",   "Timely harvest and post-harvest care"),
    ],
}


def get_crop_calendar(crop: str) -> dict:
    crop_key = crop.lower().replace(" ", "_")
    stages = CROP_CALENDAR.get(crop_key, CROP_CALENDAR["default"])

    today = date.today()
    current_month = today.month

    def month_name(m):
        return date(2000, m, 1).strftime("%b")

    def is_active(start_m, end_m):
        # handles wrap-around (e.g., Nov–Mar)
        if start_m <= end_m:
            return start_m <= current_month <= end_m
        else:
            return current_month >= start_m or current_month <= end_m

    def days_until(target_month):
        """Days until first of target_month"""
        target = date(today.year if target_month >= current_month else today.year + 1, target_month, 1)
        return max(0, (target - today).days)

    formatted = []
    current_stage = None
    next_stage = None

    for label, start_m, end_m, color, desc in stages:
        active = is_active(start_m, end_m)
        upcoming = not active and days_until(start_m) <= 45

        entry = {
            "label": label,
            "start_month": start_m,
            "end_month": end_m,
            "start_label": month_name(start_m),
            "end_label": month_name(end_m),
            "color": color,
            "description": desc,
            "active": active,
            "upcoming": upcoming,
            "days_until": days_until(start_m) if not active else 0,
        }
        formatted.append(entry)

        if active and current_stage is None:
            current_stage = entry
        if upcoming and next_stage is None:
            next_stage = entry

    return {
        "crop": crop,
        "stages": formatted,
        "current_stage": current_stage,
        "next_stage": next_stage,
        "current_month": current_month,
        "current_month_label": month_name(current_month),
    }
