# ProCrop Dataset Registry & Attribution

This document records all public and internal datasets used in ProCrop, their licensing, sources, structure, and attribution as required under Creative Commons (CC BY 4.0).

---

## 1. Time-Series Pest & Weather Datasets (Coimbatore, Tamil Nadu)

### `01_Final_Jassid_Core.xlsx`

- **Source**: All India Coordinated Research Project on Cotton (AICRP), ICAR Central Institute for Cotton Research (CICR) & Tamil Nadu Agricultural University (TNAU Coimbatore Center).
- **Annual Reports**: AICRP Annual Reports 2020-21, 2021-22, 2022-23, 2023-24, 2024-25.
- **Location**: Coimbatore, South Zone, Tamil Nadu ($11.0168^\circ\text{ N}, 76.9558^\circ\text{ E}$).
- **Entries / Varieties**: DCH 32 (Non-Bt susceptible check), Suraj (Non-Bt). Unprotected field condition.
- **Rows**: 50 weekly observation records.
- **Pest Observed**: Cotton Jassid / Leafhopper (_Amrasca biguttula biguttula_ Ishida). Unit: Jassids per 3 leaves (sampling 1 top, 1 middle, 1 bottom leaf per plant across 5 sample plants).
- **Weather Columns**: Weekly Max Temp (°C), Min Temp (°C), Morning RH (%), Evening RH (%), Rainfall (mm), Rainy Days, Wind Speed (km/h), Sunshine Hours (BSH).

### `02_Jassid_Model_Ready.xlsx`

- **Purpose**: Primary dataset for machine learning next-week cotton jassid forecasting.
- **Rows**: 40 weekly time-series rows spanning 4 seasons (2020-21, 2022-23, 2023-24, 2024-25).
- **Features**: Current week weather, 1-week lagged weather, current week jassid count (`jassid_per_3_leaves`), lagged jassid counts (`jassid_lag_1`, `jassid_lag_2`).
- **Target**: `target_next_week_jassid` (next-week observed population per 3 leaves).
- **Classification Target**: `target_high_risk_median_rule` (median-based binary target in original workbook) and calibrated ICAR/TNAU ETL (>= 6 per 3 leaves / 2 per leaf).

---

## 2. Computer Vision Datasets (Cotton Jassids & Hopper Burn)

### Dataset 1: Roboflow `hc147/cotton-jassid` (Version 4)

- **Source**: Roboflow Universe (`hc147/cotton-jassid`)
- **License**: Creative Commons Attribution 4.0 International (**CC BY 4.0**)
- **Attribution**: Published by user `hc147` on Roboflow Universe (May 2026). URL: https://universe.roboflow.com/hc147/cotton-jassid/dataset/4
- **Size**: 194 annotated high-resolution leaf underside photos.
- **Splits**: 136 train, 39 validation, 19 test.
- **Classes**: `adult` (210 annotations), `nymph` (87 annotations), `molt` (10 annotations).
- **Use in ProCrop**: Primary training and evaluation set for the deep-learning object detector predicting adult and nymph counts.

### Dataset 2: Roboflow `guava-segmentation/cotton-data-qdtse` (Version 3)

- **Source**: Roboflow Universe (`guava-segmentation/cotton-data-qdtse`)
- **License**: Creative Commons Attribution 4.0 International (**CC BY 4.0**)
- **Attribution**: Published by `guava-segmentation` on Roboflow Universe. URL: https://universe.roboflow.com/guava-segmentation/cotton-data-qdtse/dataset/3
- **Size**: 965 images across train, validation, and test splits.
- **Classes**: `leaf_blight`, `leaf_curl`, `leaf_hopper`, `leaf_redding`, `leaf_variegation`.
- **Use in ProCrop**: Cross-validation of leafhopper detection and leaf reddening/hopper burn validation.

### Dataset 3: Roboflow `cotton-plant-224mo/leaf-hopper-jassids` (Version 1)

- **Source**: Roboflow Universe (`cotton-plant-224mo/leaf-hopper-jassids`)
- **License**: Creative Commons Attribution 4.0 International (**CC BY 4.0**)
- **Attribution**: Published by `cotton-plant-224mo` on Roboflow Universe. URL: https://universe.roboflow.com/cotton-plant-224mo/leaf-hopper-jassids/dataset/1
- **Size**: 75 field photos.
- **Use in ProCrop**: Supplementary validation of cotton foliage and pest clustering.

### Dataset 4: Roboflow `cotton-plant-224mo/leaf-redding` (Version 1)

- **Source**: Roboflow Universe (`cotton-plant-224mo/leaf-redding`)
- **License**: Creative Commons Attribution 4.0 International (**CC BY 4.0**)
- **Attribution**: Published by `cotton-plant-224mo` on Roboflow Universe. URL: https://universe.roboflow.com/cotton-plant-224mo/leaf-redding/dataset/1
- **Size**: 173 field photos showing stages of leaf chlorosis, reddening, and margin necrosis.
- **Use in ProCrop**: Validation of the 0-4 hopper burn / leaf reddening grading algorithm.

---

## 3. Reference Example Imagery (`frontend/public/examples/`)

Example imagery used in the guided capture guide ("How to take a good photo") is sourced from the above CC BY 4.0 datasets and local reference photos:

1. `good_underside_nymphs.jpg`: Underside shot displaying nymphs clustered along veins (from `hc147/cotton-jassid`, CC BY 4.0).
2. `good_adult_closeup.jpg`: Adult wedge-shaped leafhopper close-up (from `hc147/cotton-jassid`, CC BY 4.0).
3. `hopperburn_grades_0_to_4.jpg`: Reference strip depicting Grades 0, 1, 2, 3, 4 injury scale.
4. `bad_blurry.jpg`: Defocused leaf photo demonstrating unacceptable quality.
5. `bad_too_far.jpg`: Full plant shot where individual nymphs (< 2 mm) cannot be resolved.
6. `bad_glare.jpg`: Direct midday sun flash causing specular reflections.

Attribution is preserved in `frontend/public/examples/CREDITS.md` and on the About & Methods page (`/how-it-works`).
