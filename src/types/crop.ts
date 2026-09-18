export type CropStage = {
  name: string;
  days: string;
  done: boolean;
  risks: string[];
};

export type Crop = {
  id: string;
  name: string;
  variety: string;
  season: string;
  fieldIds: string[];
  durationDays: number;
  idealTempC: [number, number];
  idealMoisture: [number, number];
  idealPh: [number, number];
  commonDiseases: string[];
  commonPests: string[];
  stages: CropStage[];
};
