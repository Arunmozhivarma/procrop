import os
import sys
import json
import glob
from pathlib import Path

# Ensure writable local config directories
_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
os.environ["MPLCONFIGDIR"] = os.path.join(_root, ".mplconfig")
os.environ["NUMBA_CACHE_DIR"] = os.path.join(_root, ".numbacache")
os.makedirs(os.environ["MPLCONFIGDIR"], exist_ok=True)
os.makedirs(os.environ["NUMBA_CACHE_DIR"], exist_ok=True)

import numpy as np
import cv2
from PIL import Image
from ultralytics import YOLO

DATA_YAML = os.path.join(_root, "data", "datasets", "cotton_jassid", "data.yaml")
MODELS_DIR = os.path.join(_root, "backend", "models")
os.makedirs(MODELS_DIR, exist_ok=True)

OUTPUT_MODEL = os.path.join(MODELS_DIR, "jassid_yolov8n.pt")
METRICS_FILE = os.path.join(MODELS_DIR, "detector_metrics.json")

def load_ground_truth_test_labels(test_labels_dir):
    """
    Reads YOLO format labels: class_id x_center y_center width height
    Classes: 0: adult, 1: molt, 2: nymph
    """
    gt_counts = {}
    for txt_path in glob.glob(os.path.join(test_labels_dir, "*.txt")):
        stem = Path(txt_path).stem
        adults = 0
        nymphs = 0
        molts = 0
        with open(txt_path, "r") as f:
            for line in f:
                parts = line.strip().split()
                if not parts:
                    continue
                cls_id = int(parts[0])
                if cls_id == 0:
                    adults += 1
                elif cls_id == 2:
                    nymphs += 1
                elif cls_id == 1:
                    molts += 1
        gt_counts[stem] = {
            "adults": adults,
            "nymphs": nymphs,
            "molts": molts,
            "total": adults + nymphs
        }
    return gt_counts

def evaluate_classical_heuristic(test_images_dir, gt_counts):
    """
    Classical adaptive threshold / blob detection fallback.
    Evaluates MAE on held-out test images.
    """
    total_errors = []
    for img_path in glob.glob(os.path.join(test_images_dir, "*.jpg")):
        stem = Path(img_path).stem
        if stem not in gt_counts:
            continue
        gt_total = gt_counts[stem]["total"]
        
        # Classical color & morphology blob detection
        img = cv2.imread(img_path)
        if img is None:
            continue
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Mask for pale green / yellowish sucking pest bodies
        lower_pest = np.array([20, 40, 120])
        upper_pest = np.array([55, 255, 255])
        mask = cv2.inRange(hsv, lower_pest, upper_pest)
        
        # Filter small blobs (size corresponding to 1-2mm nymphs/adults)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        pred_count = 0
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if 15 <= area <= 600:
                pred_count += 1
                
        total_errors.append(abs(pred_count - gt_total))
        
    mae = float(np.mean(total_errors)) if total_errors else 0.0
    return {
        "method": "Classical Blob / Adaptive Color Slicing (Heuristic)",
        "count_mae_per_image": round(mae, 3),
        "test_images_evaluated": len(total_errors)
    }

def train_and_evaluate():
    print("=" * 60)
    print("Step 1: Training YOLOv8n Cotton Jassid Detector on CPU")
    print(f"Data config: {DATA_YAML}")
    print("=" * 60)

    model = YOLO("yolov8n.pt")
    
    # Train on cotton_jassid dataset
    train_results = model.train(
        data=DATA_YAML,
        epochs=12,
        imgsz=640,
        batch=8,
        device="cpu",
        workers=2,
        plots=False,
        save=True,
        verbose=False,
        name="jassid_yolov8n"
    )
    
    # Locate best trained weights
    best_weights = str(train_results.save_dir / "weights" / "best.pt")
    if os.path.exists(best_weights):
        import shutil
        shutil.copy(best_weights, OUTPUT_MODEL)
        print(f"Saved trained weights to {OUTPUT_MODEL}")
    else:
        # Fallback to model save
        model.save(OUTPUT_MODEL)
        print(f"Exported model to {OUTPUT_MODEL}")

    print("\n" + "=" * 60)
    print("Step 2: Evaluating on Held-Out Test Split (Unseen Images)")
    print("=" * 60)

    # Load the best model for evaluation
    eval_model = YOLO(OUTPUT_MODEL)
    test_metrics = eval_model.val(data=DATA_YAML, split="test", device="cpu", verbose=False)
    
    precision = float(test_metrics.box.mp)
    recall = float(test_metrics.box.mr)
    map50 = float(test_metrics.box.map50)
    map50_95 = float(test_metrics.box.map)

    # Count error evaluation on individual test images
    test_images_dir = os.path.join(_root, "data", "datasets", "cotton_jassid", "test", "images")
    test_labels_dir = os.path.join(_root, "data", "datasets", "cotton_jassid", "test", "labels")
    gt_counts = load_ground_truth_test_labels(test_labels_dir)

    adult_errors = []
    nymph_errors = []
    total_errors = []
    
    test_images = glob.glob(os.path.join(test_images_dir, "*.jpg"))
    print(f"Running inference on {len(test_images)} test images for Count MAE calculation...")
    
    for img_path in test_images:
        stem = Path(img_path).stem
        if stem not in gt_counts:
            continue
        gt = gt_counts[stem]
        
        # High resolution inference (conf 0.25)
        results = eval_model.predict(img_path, conf=0.25, imgsz=960, verbose=False, device="cpu")
        pred_adults = 0
        pred_nymphs = 0
        
        if results and len(results) > 0:
            boxes = results[0].boxes
            for cls_t in boxes.cls:
                cls_id = int(cls_t.item())
                if cls_id == 0:  # adult
                    pred_adults += 1
                elif cls_id == 2:  # nymph
                    pred_nymphs += 1
                    
        pred_total = pred_adults + pred_nymphs
        adult_errors.append(abs(pred_adults - gt["adults"]))
        nymph_errors.append(abs(pred_nymphs - gt["nymphs"]))
        total_errors.append(abs(pred_total - gt["total"]))

    adult_mae = float(np.mean(adult_errors)) if adult_errors else 0.0
    nymph_mae = float(np.mean(nymph_errors)) if nymph_errors else 0.0
    total_mae = float(np.mean(total_errors)) if total_errors else 0.0

    print(f"Test Set Count MAE - Adults: {adult_mae:.3f}, Nymphs: {nymph_mae:.3f}, Total: {total_mae:.3f}")

    # Evaluate classical heuristic baseline
    heuristic_metrics = evaluate_classical_heuristic(test_images_dir, gt_counts)
    print(f"Classical Heuristic Baseline Count MAE: {heuristic_metrics['count_mae_per_image']:.3f}")

    metrics_payload = {
        "model_architecture": "YOLOv8n (ultralytics)",
        "training_dataset": {
            "name": "Roboflow Universe hc147/cotton-jassid (v4)",
            "license": "CC BY 4.0",
            "train_images": 136,
            "val_images": 39,
            "test_images": 19,
            "classes": ["adult", "molt", "nymph"]
        },
        "held_out_test_metrics": {
            "test_images": len(test_images),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "mAP_50": round(map50, 4),
            "mAP_50_95": round(map50_95, 4),
            "count_mae_per_image": {
                "adults_mae": round(adult_mae, 3),
                "nymphs_mae": round(nymph_mae, 3),
                "total_pest_mae": round(total_mae, 3)
            }
        },
        "heuristic_fallback_metrics": heuristic_metrics,
        "inference_resolution": 960,
        "slicing_tiling_supported": True,
        "quality_checks": {
            "min_laplacian_variance": 50.0,
            "min_brightness": 35.0,
            "max_brightness": 235.0
        }
    }

    with open(METRICS_FILE, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)

    print(f"\nSaved measured metrics to {METRICS_FILE}")
    print(json.dumps(metrics_payload, indent=2))

if __name__ == "__main__":
    train_and_evaluate()
