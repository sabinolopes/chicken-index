export type StateType = "resfriado" | "congelado";

export const BRANDS = ["Sadia", "Seara", "Perdigão", "Outra"] as const;
export type Brand = (typeof BRANDS)[number];

export interface ChickenPrice {
  id: string;
  brand: string;
  state_type: StateType;
  price_per_kg: number;
  market_name: string;
  city: string;
  state: string;
  recorded_at: string; // YYYY-MM-DD
  photo_url: string;
  original_sha256: string;
  exif_device: string | null;
  exif_datetime: string | null;
  has_valid_exif: boolean;
  created_at: string;
}

export interface EconomicSettings {
  min_wage: number;
  avg_wage: number;
  updated_at: string;
}

export type DataMode = "demo" | "live";

export interface DashboardData {
  mode: DataMode;
  prices: ChickenPrice[];
  settings: EconomicSettings;
  generatedAt: string;
}
