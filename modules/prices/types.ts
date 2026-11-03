export type StateType = "resfriado" | "congelado";

/** regular = preço normal de gôndola; oferta = promoção; clube = clube de descontos/fidelidade. */
export const PRICE_KINDS = ["regular", "oferta", "clube"] as const;
export type PriceKind = (typeof PRICE_KINDS)[number];

export const PRICE_KIND_LABEL: Record<PriceKind, string> = {
  regular: "Preço normal",
  oferta: "Oferta",
  clube: "Clube de desconto",
};

/** Marcas com botão próprio no cadastro e linha própria no gráfico. */
export const MAIN_BRANDS = ["Sadia", "Seara", "Perdigão"] as const;
/** No cadastro, abre o campo para digitar a marca; no gráfico, junta todas as demais marcas. */
export const OTHER_BRAND = "Outra";
export const BRANDS = [...MAIN_BRANDS, OTHER_BRAND] as const;

const isMainBrand = (brand: string) => (MAIN_BRANDS as readonly string[]).includes(brand);

/** Grupo da marca no gráfico: as principais têm linha própria; Oi Frango, Ki Frango etc. entram em "Outra". */
export const brandGroup = (brand: string) => (isMainBrand(brand) ? brand : OTHER_BRAND);

/**
 * Marca como será gravada: espaços arrumados, grafia oficial das principais ("sadia" → "Sadia")
 * e, se veio toda em minúsculas, com iniciais maiúsculas ("oi frango" → "Oi Frango").
 */
export function normalizeBrand(raw: string) {
  const brand = raw.trim().replace(/\s+/g, " ").slice(0, 40);
  const main = MAIN_BRANDS.find((candidate) => candidate.localeCompare(brand, "pt-BR", { sensitivity: "base" }) === 0);
  if (main) return main;
  if (brand !== brand.toLocaleLowerCase("pt-BR")) return brand;
  return brand.replace(/(^|\s)(\p{L})/gu, (_, space: string, letter: string) => space + letter.toLocaleUpperCase("pt-BR"));
}

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
