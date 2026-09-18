export type Field = {
  id: string;
  farmId: string;
  name: string;
  areaHa: number;
  cropId: string;
  crop: string;
  variety: string;
  growthStage: string;
  stageProgress: number;
  sownOn: string;
  healthScore: number;
  soilScore: number;
  envScore: number;
  diseaseRisk: number;
  pestRisk: number;
  lastInspection: string;
  coords: { x: number; y: number; r: number };
  notes: string;
};

export type Farm = {
  id: string;
  name: string;
  location: string;
  district: string;
  totalHa: number;
  soilType: string;
  irrigation: string;
  owner: string;
  established: string;
};
