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

export interface AutoPredictResponse {
  vision_analysis: VisionDetectionResult;
  live_weather: LiveWeatherResponse;
  prediction: PredictionResponse;
}

const API_BASE_URL = "http://localhost:8000";

export async function fetchLiveCoimbatoreWeather(): Promise<LiveWeatherResponse> {
  const res = await fetch(`${API_BASE_URL}/weather/coimbatore`);
  if (!res.ok) {
    throw new Error(`Weather API Error: ${res.statusText}`);
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
    throw new Error(`Vision API Error: ${res.statusText}`);
  }
  return res.json();
}

export async function autoPredictFromPhotoAndWeather(
  file: File,
  lag1 = 1.8,
  lag2 = 1.5
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
    throw new Error(`Auto Predict API Error: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchLivePrediction(
  inputData: JassidPredictionInput
): Promise<PredictionResponse> {
  const res = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(inputData),
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.statusText}`);
  }

  return res.json();
}

export async function fetchLatestDatasetPrediction(): Promise<PredictionResponse> {
  const res = await fetch(`${API_BASE_URL}/dataset/predict-latest`);
  if (!res.ok) {
    throw new Error(`API Error: ${res.statusText}`);
  }
  return res.json();
}
