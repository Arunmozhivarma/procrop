import os
import json
import datetime
from typing import Dict, Any, List, Optional

_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
REC_CONFIG_PATH = os.path.join(_root, "backend", "config", "recommendations.json")

def load_recommendations_config() -> Dict[str, Any]:
    if os.path.exists(REC_CONFIG_PATH):
        with open(REC_CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "version": "1.0.0",
        "disclaimer": "Advisory only. Confirm with your local agriculture officer / KVK and follow the product label.",
        "rules": []
    }

def get_recommendation(
    risk_class: str,
    hopper_burn_grade: float,
    share_burn_ge_2: float,
    last_spray_class: Optional[str] = None,
    last_spray_date: Optional[str] = None,
    check_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Looks up actions from the rule-based decision table in backend/config/recommendations.json:
    Keys: risk_class x hopper_burn_bucket x recently_sprayed
    """
    config = load_recommendations_config()
    
    # Check date or current date
    if check_date:
        try:
            base_dt = datetime.date.fromisoformat(check_date[:10])
        except Exception:
            base_dt = datetime.date.today()
    else:
        base_dt = datetime.date.today()

    # Determine recently sprayed
    recently_sprayed = False
    days_since_spray = None
    if last_spray_date and last_spray_date not in ("none", "no spray yet", ""):
        try:
            sp_dt = datetime.date.fromisoformat(last_spray_date[:10])
            days_since_spray = (base_dt - sp_dt).days
            if 0 <= days_since_spray <= 14:
                recently_sprayed = True
        except Exception:
            pass

    # Determine hopper burn bucket
    if hopper_burn_grade >= 2.0 or share_burn_ge_2 >= 0.25:
        hopper_bucket = "moderate_or_high"
    else:
        hopper_bucket = "low"

    # Search for matching rule in decision table
    matched_rule = None
    for r in config.get("rules", []):
        if r["risk_class"].lower() != risk_class.lower():
            continue
        # Check recently_sprayed match
        if r.get("recently_sprayed") is not None and r["recently_sprayed"] != recently_sprayed:
            continue
        # Check hopper_burn_bucket match
        hb = r.get("hopper_burn_bucket", "any")
        if hb != "any" and hb != hopper_bucket:
            continue
        matched_rule = r
        break

    if not matched_rule:
        # Fallback default rule
        for r in config.get("rules", []):
            if r["risk_class"].lower() == risk_class.lower():
                matched_rule = r
                break

    if not matched_rule:
        matched_rule = {
            "rescout_days": 5,
            "urgency": "Standard Advisory",
            "headline": f"Risk assessment: {risk_class}",
            "actions": [
                "Scout 15 leaves across 5 plants to monitor pest progression.",
                "Conserve beneficial predators and avoid excess nitrogen fertilizer."
            ],
            "spray_guidance": "Consult local KVK / agricultural officer before chemical intervention."
        }

    rescout_days = matched_rule.get("rescout_days", 5)
    rescout_dt = base_dt + datetime.timedelta(days=rescout_days)
    formatted_rescout = f"{rescout_dt.strftime('%B %d, %Y')} (in {rescout_days} days)"

    # Determine chemical rotation suggestions
    current_spray_class = last_spray_class.lower() if last_spray_class else "none"
    rotation_options = config.get("class_rotation_matrix", {}).get(current_spray_class, ["botanical_neem", "neonicotinoid", "organophosphate"])
    clean_rotations = [opt.replace("_", " ").title() for opt in rotation_options if opt != current_spray_class]

    rotation_note = None
    if current_spray_class and current_spray_class not in ("none", "no spray yet"):
        rotation_note = f"Prior treatment used {current_spray_class.replace('_', ' ').title()}. In accordance with IRAC anti-resistance IPM guidance, do not spray the same chemical class consecutively. Suggested rotation classes: {', '.join(clean_rotations)}."

    return {
        "risk_class": risk_class,
        "urgency": matched_rule.get("urgency", "Advisory"),
        "headline": matched_rule.get("headline", ""),
        "rescout_date": formatted_rescout,
        "rescout_days": rescout_days,
        "actions": matched_rule.get("actions", []),
        "spray_guidance": matched_rule.get("spray_guidance", ""),
        "rotation_note": rotation_note,
        "disclaimer": config.get("disclaimer", "Advisory only. Confirm with your local agriculture officer / KVK and follow the product label.")
    }
