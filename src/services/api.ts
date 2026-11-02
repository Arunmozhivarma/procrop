export interface AppConfig {
  upload: {
    min_images: number;
    target_images: number;
    max_images: number;
    max_image_mb: number;
    compression_max_dimension: number;
    compression_quality: number;
  };
  economic_threshold_level: {
    jassids_per_leaf: number;
    jassids_per_3_leaves: number;
    source: string;
    description: string;
  };
  risk_classes: {
    low: {
      label: string;
      max_jassids_per_leaf: number;
      max_jassids_per_3_leaves: number;
      max_burn_grade: number;
      description: string;
    };
    medium: {
      label: string;
      min_jassids_per_leaf: number;
      max_jassids_per_leaf: number;
      min_jassids_per_3_leaves: number;
      max_jassids_per_3_leaves: number;
      burn_grade: number;
      description: string;
    };
    high: {
      label: string;
      min_jassids_per_leaf: number;
      min_jassids_per_3_leaves: number;
      burn_grade: number;
      description: string;
    };
  };
  hopper_burn_override_share: number;
  confidence_levels: {
    high: { min_images: number; label: string; description: string };
    medium: { min_images: number; max_images: number; label: string; description: string };
    low: { min_images: number; max_images: number; label: string; description: string };
  };
  sampling_protocol: {
    target_plants: number;
    leaves_per_plant: number;
    canopy_levels: string[];
    orientation: string;
  };
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  upload: {
    min_images: 5,
    target_images: 15,
    max_images: 30,
    max_image_mb: 8,
    compression_max_dimension: 1600,
    compression_quality: 0.85,
  },
  economic_threshold_level: {
    jassids_per_leaf: 2.0,
    jassids_per_3_leaves: 6.0,
    source: "ICAR-CICR & TNAU Agritech Portal (Cotton IPM)",
    description: "ETL: 2 nymphs/leaf (6 per 3 leaves), or Grade II hopper burn.",
  },
  risk_classes: {
    low: {
      label: "Low",
      max_jassids_per_leaf: 1.0,
      max_jassids_per_3_leaves: 3.0,
      max_burn_grade: 1,
      description: "Below 50% of ETL and hopper burn grade <= 1.",
    },
    medium: {
      label: "Medium",
      min_jassids_per_leaf: 1.0,
      max_jassids_per_leaf: 2.0,
      min_jassids_per_3_leaves: 3.0,
      max_jassids_per_3_leaves: 6.0,
      burn_grade: 2,
      description: "50% to 100% of ETL, or grade 2 hopper burn appearing.",
    },
    high: {
      label: "High",
      min_jassids_per_leaf: 2.0,
      min_jassids_per_3_leaves: 6.0,
      burn_grade: 2,
      description: "At or exceeding ETL (>= 2.0 per leaf) or widespread hopper burn grade >= 2.",
    },
  },
  hopper_burn_override_share: 0.25,
  confidence_levels: {
    high: {
      min_images: 15,
      label: "High Confidence",
      description: "15 or more photos with verified foliage clarity",
    },
    medium: {
      min_images: 8,
      max_images: 14,
      label: "Medium Confidence",
      description: "8 to 14 photos analysed",
    },
    low: {
      min_images: 5,
      max_images: 7,
      label: "Low Confidence",
      description: "5 to 7 photos analysed; below target sample size",
    },
  },
  sampling_protocol: {
    target_plants: 5,
    leaves_per_plant: 3,
    canopy_levels: ["top", "middle", "bottom"],
    orientation: "underside",
  },
};

export async function fetchAppConfig(): Promise<AppConfig> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/config`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback to DEFAULT_APP_CONFIG
  }
  return DEFAULT_APP_CONFIG;
}

export interface JassidPredictionInput {
  jassid_per_3_leaves: number;
  jassid_lag_1: number;
  jassid_lag_2: number;
  max_temp_c: number;
  min_temp_c: number;
  rh_morning_pct: number;
  rh_evening_pct: number;
  rainfall_mm: number;
  rainy_days: number;
  wind_speed_kmh: number;
  sunshine_hours: number;
  max_temp_c_lag_1: number;
  min_temp_c_lag_1: number;
  rh_morning_pct_lag_1: number;
  rh_evening_pct_lag_1: number;
  rainfall_mm_lag_1: number;
  rainy_days_lag_1: number;
  wind_speed_kmh_lag_1: number;
  sunshine_hours_lag_1: number;
}

export interface FeatureContribution {
  feature: string;
  value?: number;
  contribution: number;
}

export interface PredictionResponse {
  predicted_next_week_jassid: number;
  risk: "HIGH" | "LOW";
  risk_threshold: number;
  model_used: string;
  threshold_disclaimer?: string;
  explanation: FeatureContribution[];
}

export interface LiveWeatherResponse {
  source: string;
  location: string;
  max_temp_c: number;
  min_temp_c: number;
  rh_morning_pct: number;
  rh_evening_pct: number;
  rainfall_mm: number;
  rainy_days: number;
  wind_speed_kmh: number;
  sunshine_hours: number;
  mean_temp_c: number;
  mean_rh_pct: number;
  timestamp: string;
}

export interface VisionDetectionResult {
  filename: string;
  image_width: number;
  image_height: number;
  detected_spots_on_leaf: number;
  jassid_per_3_leaves: number;
  severity: "HIGH" | "MODERATE" | "LOW";
  headline: string;
  confidence: number;
  affected_area_pct: number;
  detections: Array<{
    id: string;
    label: string;
    confidence: number;
    box: { x_pct: number; y_pct: number; w_pct: number; h_pct: number };
  }>;
  symptoms: Array<{ title: string; body: string }>;
}

export interface PreviousWeekData {
  source: string;
  report_year: string;
  smw: number;
  location: string;
  jassid_per_3_leaves: number;
  jassid_lag_1: number;
  jassid_lag_2: number;
  max_temp_c: number;
  min_temp_c: number;
  rh_morning_pct: number;
  rh_evening_pct: number;
  rainfall_mm: number;
  rainy_days: number;
  wind_speed_kmh: number;
  sunshine_hours: number;
  max_temp_c_lag_1: number;
  min_temp_c_lag_1: number;
  rh_morning_pct_lag_1: number;
  rh_evening_pct_lag_1: number;
  rainfall_mm_lag_1: number;
  rainy_days_lag_1: number;
  wind_speed_kmh_lag_1: number;
  sunshine_hours_lag_1: number;
}

export interface SavedPredictionRecord {
  id: number;
  created_at: string;
  image_name: string;
  detected_jassid: number;
  prev_week_smw: number;
  prev_week_jassid_lag_1: number;
  prev_week_jassid_lag_2: number;
  weather_source: string;
  max_temp_c: number;
  min_temp_c: number;
  rh_morning_pct: number;
  rh_evening_pct?: number;
  rainfall_mm: number;
  rainy_days?: number;
  wind_speed_kmh?: number;
  sunshine_hours?: number;
  predicted_next_week_jassid: number;
  risk: "HIGH" | "LOW";
  risk_threshold: number;
  model_used: string;
  explanation?: FeatureContribution[];
}

export interface UnifiedPredictionResponse {
  vision_analysis: VisionDetectionResult;
  live_weather: LiveWeatherResponse;
  previous_week_data: PreviousWeekData;
  prediction: PredictionResponse;
  db_record: {
    id: number;
    created_at: string;
    status: string;
  };
}

export interface AutoPredictResponse {
  vision_analysis: VisionDetectionResult;
  live_weather: LiveWeatherResponse;
  prediction: PredictionResponse;
}

const API_BASE_URL = "http://localhost:8000";

export async function fetchLiveCoimbatoreWeather(): Promise<LiveWeatherResponse> {
  const res = await fetch(`${API_BASE_URL}/weather/coimbatore`);
  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    throw new Error(`Weather API Error (${res.status}): ${errorText}`);
  }
  return res.json();
}

export async function fetchPreviousWeekData(): Promise<PreviousWeekData> {
  const res = await fetch(`${API_BASE_URL}/dataset/previous-week`);
  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    throw new Error(`Previous Week API Error (${res.status}): ${errorText}`);
  }
  return res.json();
}

export async function fetchRecentPredictions(limit = 15): Promise<SavedPredictionRecord[]> {
  const res = await fetch(`${API_BASE_URL}/predictions?limit=${limit}`);
  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    throw new Error(`Predictions API Error (${res.status}): ${errorText}`);
  }
  return res.json();
}

export async function analyzeLeafPhoto(file: File): Promise<VisionDetectionResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE_URL}/analyze-leaf-image`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    throw new Error(`Vision API Error (${res.status}): ${errorText}`);
  }
  return res.json();
}

export async function runUnifiedPrediction(params: {
  file?: File;
  sampleId?: string;
  overrideJassid?: number;
  overrideLag1?: number;
  overrideLag2?: number;
  overrideMaxTemp?: number;
  overrideMinTemp?: number;
  overrideRainfall?: number;
  overrideRh?: number;
}): Promise<UnifiedPredictionResponse> {
  const formData = new FormData();
  if (params.file) {
    formData.append("file", params.file);
  }
  if (params.sampleId) {
    formData.append("sample_id", params.sampleId);
  }
  if (params.overrideJassid !== undefined) {
    formData.append("override_jassid", params.overrideJassid.toString());
  }
  if (params.overrideLag1 !== undefined) {
    formData.append("override_lag_1", params.overrideLag1.toString());
  }
  if (params.overrideLag2 !== undefined) {
    formData.append("override_lag_2", params.overrideLag2.toString());
  }
  if (params.overrideMaxTemp !== undefined) {
    formData.append("override_max_temp", params.overrideMaxTemp.toString());
  }
  if (params.overrideMinTemp !== undefined) {
    formData.append("override_min_temp", params.overrideMinTemp.toString());
  }
  if (params.overrideRainfall !== undefined) {
    formData.append("override_rainfall", params.overrideRainfall.toString());
  }
  if (params.overrideRh !== undefined) {
    formData.append("override_rh", params.overrideRh.toString());
  }

  const res = await fetch(`${API_BASE_URL}/predict-unified`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const errJson = await res.json();
      detail = errJson.detail || JSON.stringify(errJson);
    } catch {
      // fallback
    }
    throw new Error(`Unified Prediction Error (${res.status}): ${detail}`);
  }

  return res.json();
}

export async function autoPredictFromPhotoAndWeather(
  file: File,
  lag1 = 1.8,
  lag2 = 1.5,
): Promise<AutoPredictResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("jassid_lag_1", lag1.toString());
  formData.append("jassid_lag_2", lag2.toString());

  const res = await fetch(`${API_BASE_URL}/auto-predict`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    throw new Error(`Auto Predict API Error (${res.status}): ${errorText}`);
  }
  return res.json();
}

export async function fetchLivePrediction(
  inputData: JassidPredictionInput,
): Promise<PredictionResponse> {
  const res = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(inputData),
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const errJson = await res.json();
      detail = errJson.detail || JSON.stringify(errJson);
    } catch {
      // fallback
    }
    throw new Error(`Prediction Error (${res.status}): ${detail}`);
  }

  return res.json();
}

export async function fetchLatestDatasetPrediction(): Promise<PredictionResponse> {
  const res = await fetch(`${API_BASE_URL}/dataset/predict-latest`);
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const errJson = await res.json();
      detail = errJson.detail || JSON.stringify(errJson);
    } catch {
      // fallback
    }
    throw new Error(`Dataset Prediction Error (${res.status}): ${detail}`);
  }
  return res.json();
}
