export interface SoilPhoto {
  id: string;
  dataUrl: string;
  mimeType: string;
}

export interface SoilAnalysisResult {
  soil_type: string;
  color_texture_observations: string[];
  health_assessment: string;
  health_score: number;
  concerns: string[];
  recommendations: string[];
  suggested_additional_inputs: string[];
  suitable_crops?: string[];
  confidence_note: string;
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  location: string;
  notes: string;
  thumbnail: string;
  result: SoilAnalysisResult;
}
