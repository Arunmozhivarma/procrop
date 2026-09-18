export type FeatureContribution = {
  feature: string;
  value: string;
  impact: number;
};

export type Prediction = {
  id: string;
  fieldId: string;
  fieldName: string;
  crop: string;
  createdAt: string;
  model: "Random Forest" | "XGBoost" | "Ensemble (RF + XGBoost)";
  healthScore: number;
  diseaseRisk: number;
  pestRisk: number;
  confidence: number;
  headline: string;
  narrative: string;
  requiresImage: boolean;
  contributions: FeatureContribution[];
  suspectedIssues: { name: string; probability: number }[];
};

export type ImageAnalysis = {
  id: string;
  fieldId: string;
  fieldName: string;
  crop: string;
  capturedAt: string;
  thumb: string;
  label: string;
  confidence: number;
  severity: "none" | "mild" | "moderate" | "severe";
  affectedArea: number;
  status: "complete" | "processing" | "failed";
  symptoms: { icon: string; title: string; body: string }[];
  gradcam: { x: number; y: number; w: number; h: number; label: string }[];
  predictionId?: string;
};

export type ModelPerformanceItem = {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
};
