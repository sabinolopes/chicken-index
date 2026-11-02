export type StateType = "resfriado" | "congelado";

/** regular = preço normal de gôndola; oferta = promoção; clube = clube de descontos/fidelidade. */
export const PRICE_KINDS = ["regular", "oferta", "clube"] as const;
export type PriceKind = (typeof PRICE_KINDS)[number];

export const PRICE_KIND_LABEL: Record<PriceKind, string> = {
  regular: "Preço normal",
  oferta: "Oferta",
  clube: "Clube de desconto",
};

export const BRANDS = ["Sadia", "Seara", "Perdigão", "Outra"] as const;
export type Brand = (typeof BRANDS)[number];

export interface ChickenPrice {
  id: string;
  brand: string;
  state_type: StateType;
  price_kind: PriceKind;
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
