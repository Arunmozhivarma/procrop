import os
import io
import math
import cv2
import numpy as np
from PIL import Image
from typing import List, Dict, Any, Optional

from backend.hopper_burn import HopperBurnGrader

_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
os.environ.setdefault("MPLCONFIGDIR", os.path.join(_root, ".mplconfig"))
os.environ.setdefault("NUMBA_CACHE_DIR", os.path.join(_root, ".numbacache"))

YOLO_MODEL_PATH = os.path.join(_root, "backend", "models", "jassid_yolov8n.pt")
FALLBACK_YOLO_PATH = os.path.join(_root, "yolov8n.pt")

_yolo_model = None
_hopper_grader = HopperBurnGrader()

def get_yolo_detector():
    """Lazily loads the trained YOLOv8n model on CPU."""
    global _yolo_model
    if _yolo_model is None:
        model_file = YOLO_MODEL_PATH if os.path.exists(YOLO_MODEL_PATH) else FALLBACK_YOLO_PATH
        if os.path.exists(model_file):
            try:
                from ultralytics import YOLO
                _yolo_model = YOLO(model_file)
            except Exception as e:
                print(f"[vision_detector] Warning: Failed to load YOLO model: {e}")
                _yolo_model = None
    return _yolo_model

def check_image_quality(img_cv: np.ndarray) -> Dict[str, Any]:
    """
    Performs deterministic image quality checks:
    - Laplacian variance for blur (< 45.0 = blurry)
    - Mean brightness (< 35.0 = too dark, > 235.0 = overexposed/glare)
    - Leaf presence (HSV green/yellow/red foliage pixels >= 10%)
    """
    h, w = img_cv.shape[:2]
    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    
    # 1. Blur check
    lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    is_blurry = lap_var < 45.0

    # 2. Brightness check
    brightness = float(np.mean(gray))
    is_underexposed = brightness < 35.0
    is_overexposed = brightness > 235.0

    # 3. Leaf presence check
    hsv = cv2.cvtColor(img_cv, cv2.COLOR_BGR2HSV)
    # Foliage mask: greenish, yellowish or reddened leaf tissue
    foliage_mask = ((hsv[:, :, 1] > 25) & (hsv[:, :, 2] > 30) & (hsv[:, :, 2] < 250))
    foliage_pct = float(np.sum(foliage_mask)) / (h * w) * 100.0
    has_leaf = foliage_pct >= 10.0

    warning = None
    if is_blurry:
        warning = f"Image is blurry (sharpness score {lap_var:.1f} < 45). Hold camera steady 15-20 cm away."
    elif is_underexposed:
        warning = f"Image is too dark (brightness {brightness:.1f} < 35). Ensure sufficient natural light."
    elif is_overexposed:
        warning = f"Image has severe glare/overexposure (brightness {brightness:.1f} > 235). Avoid direct sun reflection."
    elif not has_leaf:
        warning = f"No clear cotton leaf recognized (foliage area {foliage_pct:.1f}% < 10%). Frame single leaf underside."

    is_valid = not (is_blurry or is_underexposed or is_overexposed or not has_leaf)

    return {
        "is_valid": is_valid,
        "blur_score": round(lap_var, 1),
        "brightness": round(brightness, 1),
        "foliage_pct": round(foliage_pct, 1),
        "has_leaf": has_leaf,
        "warning": warning
    }

def detect_with_classical_heuristic(img_cv: np.ndarray) -> Dict[str, Any]:
    """
    Classical blob detection fallback if YOLO weights are unavailable.
    Clearly tagged as heuristic.
    """
    h, w = img_cv.shape[:2]
    hsv = cv2.cvtColor(img_cv, cv2.COLOR_BGR2HSV)
    lower_pest = np.array([20, 40, 110])
    upper_pest = np.array([55, 255, 255])
    mask = cv2.inRange(hsv, lower_pest, upper_pest)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    detections = []
    adults = 0
    nymphs = 0

    for i, cnt in enumerate(contours):
        area = cv2.contourArea(cnt)
        if 15 <= area <= 600:
            x, y, bw, bh = cv2.boundingRect(cnt)
            # Area heuristic: small (< 120) = nymph, larger = adult
            is_adult = area > 120
            if is_adult:
                adults += 1
                lbl = "Jassid Adult (Amrasca biguttula)"
            else:
                nymphs += 1
                lbl = "Jassid Nymph (Amrasca biguttula)"

            detections.append({
                "id": f"heuristic-{i+1}",
                "label": lbl,
                "confidence": 0.50,
                "box": {
                    "x_pct": round((x / w) * 100.0, 1),
                    "y_pct": round((y / h) * 100.0, 1),
                    "w_pct": round((bw / w) * 100.0, 1),
                    "h_pct": round((bh / h) * 100.0, 1)
                }
            })

    return {
        "n_adults": adults,
        "n_nymphs": nymphs,
        "total": adults + nymphs,
        "mean_confidence": 0.50 if detections else 0.0,
        "detections": detections,
        "method_used": "heuristic_classical_blob"
    }

def analyze_cotton_leaf_image(image_bytes: bytes, filename: str = "leaf.jpg") -> Dict[str, Any]:
    """
    Analyzes an uploaded cotton leaf photo to detect cotton jassid pest population (adults & nymphs)
    and evaluates hopper burn injury on the 0-4 ICCC/AICRP scale.
    Performs real-time quality validation (blur, lighting, foliage presence).
    """
    # 1. Decode image bytes
    try:
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        width, height = pil_img.size
        img_np = np.array(pil_img)
        img_cv = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
    except Exception as e:
        return {
            "filename": filename,
            "image_width": 0,
            "image_height": 0,
            "detected_spots_on_leaf": 0,
            "jassid_per_3_leaves": 0.0,
            "severity": "UNKNOWN",
            "headline": "Failed to decode image file",
            "confidence": 0.0,
            "affected_area_pct": 0.0,
            "detections": [],
            "symptoms": [],
            "n_adults": 0,
            "n_nymphs": 0,
            "total": 0,
            "quality_flags": {
                "is_valid": False,
                "warning": f"Image decode error: {str(e)}"
            },
            "hopper_burn": {
                "grade": 0,
                "label": "Unknown",
                "affected_area_pct": 0.0
            },
            "method_used": "none"
        }

    # 2. Image Quality Verification
    quality = check_image_quality(img_cv)

    # 3. Hopper Burn Assessment (ICCC Scale 0-4)
    hopper_burn_res = _hopper_grader.grade_image(img_np)

    # 4. Jassid Counting: YOLOv8n Detector with high-res inference
    yolo = get_yolo_detector()
    detections = []
    n_adults = 0
    n_nymphs = 0
    n_molts = 0
    mean_conf = 0.0
    method_used = "yolov8n_neural_detector"

    if yolo is not None and quality["has_leaf"]:
        try:
            # Inference at 960 resolution
            results = yolo.predict(pil_img, conf=0.22, imgsz=960, verbose=False, device="cpu")
            if results and len(results) > 0:
                boxes = results[0].boxes
                confs = []
                for i, box in enumerate(boxes):
                    cls_id = int(box.cls[0].item())
                    conf = float(box.conf[0].item())
                    confs.append(conf)
                    xyxy = box.xyxy[0].tolist()
                    x1, y1, x2, y2 = xyxy

                    # Map classes: 0 = adult, 1 = molt, 2 = nymph
                    if cls_id == 0:
                        n_adults += 1
                        label_name = "Jassid Adult (Amrasca biguttula)"
                    elif cls_id == 2:
                        n_nymphs += 1
                        label_name = "Jassid Nymph (Amrasca biguttula)"
                    else:
                        n_molts += 1
                        label_name = "Jassid Cast Skin / Exuviae"

                    detections.append({
                        "id": f"yolo-{i+1}",
                        "label": label_name,
                        "confidence": round(conf, 2),
                        "class_id": cls_id,
                        "box": {
                            "x_pct": round((x1 / width) * 100.0, 1),
                            "y_pct": round((y1 / height) * 100.0, 1),
                            "w_pct": round(((x2 - x1) / width) * 100.0, 1),
                            "h_pct": round(((y2 - y1) / height) * 100.0, 1)
                        }
                    })
                if confs:
                    mean_conf = round(float(np.mean(confs)), 2)
        except Exception as e:
            print(f"[vision_detector] YOLO inference error: {e}, falling back to classical detector")
            fallback = detect_with_classical_heuristic(img_cv)
            n_adults = fallback["n_adults"]
            n_nymphs = fallback["n_nymphs"]
            detections = fallback["detections"]
            mean_conf = fallback["mean_confidence"]
            method_used = fallback["method_used"]
    else:
        fallback = detect_with_classical_heuristic(img_cv)
        n_adults = fallback["n_adults"]
        n_nymphs = fallback["n_nymphs"]
        detections = fallback["detections"]
        mean_conf = fallback["mean_confidence"]
        method_used = fallback["method_used"]

    total_jassids = n_adults + n_nymphs
    # In AICRP standards, field metric is per 3 leaves. 
    # For a single leaf, estimated equivalent is total * 3:
    jassid_per_3_leaves = round(float(total_jassids * 3.0), 1)

    # Dynamic severity derived from agronomic threshold (ETL = 6.0 per 3 leaves = 2.0/leaf)
    if jassid_per_3_leaves >= 6.0 or hopper_burn_res["grade"] >= 3:
        severity = "HIGH"
        headline = f"HIGH Jassid infestation detected ({total_jassids} on leaf / ~{jassid_per_3_leaves} per 3 leaves)"
        symptoms = [
            {
                "title": "Severe Hopper Burn & Leaf Scorching",
                "body": f"{hopper_burn_res['label']}: Toxicogenic feeding causes pronounced curling with {hopper_burn_res['margin_discoloration_pct']}% margin chlorosis/necrosis."
            },
            {
                "title": "Yield Damage Warning",
                "body": "Pest density exceeds ICAR economic threshold level (ETL). Immediate intervention recommended."
            }
        ]
    elif jassid_per_3_leaves >= 3.0 or hopper_burn_res["grade"] >= 2:
        severity = "MODERATE"
        headline = f"MODERATE Jassid pressure detected ({total_jassids} on leaf / ~{jassid_per_3_leaves} per 3 leaves)"
        symptoms = [
            {
                "title": "Marginal Chlorosis & Leaf Cupping",
                "body": f"{hopper_burn_res['label']}: Noticeable yellowing on {hopper_burn_res['margin_discoloration_pct']}% of outer leaf margins."
            },
            {
                "title": "Close Monitoring Needed",
                "body": "Population is within the 50-100% ETL economic window; scout neighboring canopy."
            }
        ]
    else:
        severity = "LOW"
        headline = f"LOW Jassid count ({total_jassids} on leaf / ~{jassid_per_3_leaves} per 3 leaves)"
        symptoms = [
            {
                "title": "Healthy Leaf Canopy",
                "body": f"{hopper_burn_res['label']}: Leaf blade tissue is sound with low discoloration ({hopper_burn_res['affected_area_pct']}%)."
            },
            {
                "title": "Safe Population",
                "body": "Pest pressure is well below economic threshold level. Maintain routine scouting."
            }
        ]

    return {
        "filename": filename,
        "image_width": width,
        "image_height": height,
        "detected_spots_on_leaf": total_jassids,
        "jassid_per_3_leaves": jassid_per_3_leaves,
        "severity": severity,
        "headline": headline,
        "confidence": mean_conf if mean_conf > 0 else (0.85 if quality["is_valid"] else 0.40),
        "affected_area_pct": hopper_burn_res["affected_area_pct"],
        "detections": detections,
        "symptoms": symptoms,
        "n_adults": n_adults,
        "n_nymphs": n_nymphs,
        "n_molts": n_molts,
        "total": total_jassids,
        "quality_flags": quality,
        "hopper_burn": hopper_burn_res,
        "method_used": method_used
    }

def aggregate_leaf_submissions(image_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes rigorous statistical aggregation across a multi-leaf submission:
    - mean_per_leaf, sd, cv, variance_to_mean_ratio (patchiness)
    - bootstrap 95% CI of the mean (1000 resamples)
    - n_images_uploaded, n_images_used, n_images_rejected
    - mean_burn_grade, share_of_images_with_grade_ge_2
    - confidence: High (>= 15), Medium (8-14), Low (5-7)
    """
    total_uploaded = len(image_results)
    valid_results = [r for r in image_results if r.get("quality_flags", {}).get("is_valid", True)]
    rejected_results = [r for r in image_results if not r.get("quality_flags", {}).get("is_valid", True)]

    # If all images failed quality, fall back to evaluating whatever was uploaded with low confidence
    evaluation_set = valid_results if len(valid_results) > 0 else image_results

    counts = [float(r.get("total", 0)) for r in evaluation_set]
    burn_grades = [int(r.get("hopper_burn", {}).get("grade", 0)) for r in evaluation_set]

    n_used = len(evaluation_set)
    mean_per_leaf = float(np.mean(counts)) if counts else 0.0
    sd = float(np.std(counts, ddof=1)) if len(counts) > 1 else 0.0
    cv = (sd / mean_per_leaf) if mean_per_leaf > 0 else 0.0
    var = float(np.var(counts, ddof=1)) if len(counts) > 1 else 0.0
    patchiness = (var / mean_per_leaf) if mean_per_leaf > 0 else 1.0

    # Bootstrap 95% Confidence Interval (1000 iterations)
    if len(counts) >= 3:
        rng = np.random.default_rng(42)
        boot_means = [float(np.mean(rng.choice(counts, size=len(counts), replace=True))) for _ in range(1000)]
        ci_lower = round(float(np.percentile(boot_means, 2.5)), 2)
        ci_upper = round(float(np.percentile(boot_means, 97.5)), 2)
    else:
        ci_lower = round(max(0.0, mean_per_leaf - 1.96 * (sd / math.sqrt(max(1, len(counts))))), 2)
        ci_upper = round(mean_per_leaf + 1.96 * (sd / math.sqrt(max(1, len(counts)))), 2)

    mean_burn_grade = round(float(np.mean(burn_grades)), 2) if burn_grades else 0.0
    share_burn_ge_2 = round(float(np.mean([1.0 if g >= 2 else 0.0 for g in burn_grades])), 3) if burn_grades else 0.0

    # Determine confidence level
    if len(valid_results) >= 15:
        confidence_level = "High"
    elif len(valid_results) >= 8:
        confidence_level = "Medium"
    elif len(valid_results) >= 5:
        confidence_level = "Low"
    else:
        confidence_level = "Very Low"

    total_adults = sum(r.get("n_adults", 0) for r in evaluation_set)
    total_nymphs = sum(r.get("n_nymphs", 0) for r in evaluation_set)
    total_pests = total_adults + total_nymphs

    return {
        "n_images_uploaded": total_uploaded,
        "n_images_used": n_used,
        "n_images_rejected": len(rejected_results),
        "rejected_reasons": [
            {
                "filename": r.get("filename", "unknown"),
                "warning": r.get("quality_flags", {}).get("warning", "Quality check failed")
            }
            for r in rejected_results
        ],
        "mean_per_leaf": round(mean_per_leaf, 2),
        "jassid_per_3_leaves": round(mean_per_leaf * 3.0, 2),
        "total_pests_counted": total_pests,
        "total_adults": total_adults,
        "total_nymphs": total_nymphs,
        "sd": round(sd, 2),
        "cv": round(cv, 2),
        "variance_to_mean_ratio": round(patchiness, 2),
        "bootstrap_ci_95": {
            "lower": ci_lower,
            "upper": ci_upper
        },
        "mean_burn_grade": mean_burn_grade,
        "share_of_images_with_grade_ge_2": share_burn_ge_2,
        "confidence_level": confidence_level
    }
