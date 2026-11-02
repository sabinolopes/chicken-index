import { BRANDS, PRICE_KINDS, type PriceKind, type StateType } from "./types";

export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
  "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;

export const MAX_PHOTO_BYTES = 1024 * 1024; // igual ao limite do bucket
export const PHOTO_MIME_TYPES = ["image/webp", "image/jpeg"];

/** "21,99" | "21.99" | "R$ 21,99" → 21.99 (ou NaN). */
export function parsePrice(raw: string) {
  const cleaned = raw.replace(/[^\d,.]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  return cleaned ? Math.round(Number(cleaned) * 100) / 100 : NaN;
}

/** Data de hoje (YYYY-MM-DD) no fuso de Brasília. */
export function todayInBrazil(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now);
}

export interface PriceInput {
  brand: string;
  state_type: StateType;
  price_kind: PriceKind;
  price_per_kg: number;
  market_name: string;
  city: string;
  state: string;
  recorded_at: string;
  original_sha256: string;
  exif_device: string | null;
  exif_datetime: string | null;
  has_valid_exif: boolean;
}

const text = (value: FormDataEntryValue | null, max = 80) => String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max);

/** Valida os campos do formulário (roda de novo no servidor — nunca confiar no cliente). */
export function parsePriceForm(form: FormData): { data: PriceInput } | { error: string } {
  const brand = text(form.get("brand"));
  const stateType = text(form.get("state_type"));
  const priceKind = text(form.get("price_kind")) || "regular";
  const price = parsePrice(text(form.get("price_per_kg")));
  const market = text(form.get("market_name"));
  const city = text(form.get("city"));
  const uf = text(form.get("state")).toUpperCase();
  const recordedAt = text(form.get("recorded_at"));
  const sha = text(form.get("original_sha256")).toLowerCase();
  const device = text(form.get("exif_device"), 120) || null;
  const exifDatetime = text(form.get("exif_datetime"), 40) || null;
  const hasValidExif = form.get("has_valid_exif") === "true";

  if (!(BRANDS as readonly string[]).includes(brand)) return { error: "Selecione a marca." };
  if (stateType !== "resfriado" && stateType !== "congelado") return { error: "Selecione resfriado ou congelado." };
  if (!(PRICE_KINDS as readonly string[]).includes(priceKind)) return { error: "Tipo de preço inválido." };
  if (!Number.isFinite(price) || price < 1 || price > 500) return { error: "Preço por kg inválido (ex.: 21,99)." };
  if (!market) return { error: "Informe o mercado." };
  if (!city) return { error: "Informe a cidade." };
  if (!(UFS as readonly string[]).includes(uf)) return { error: "Selecione o estado (UF)." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(recordedAt) || recordedAt < "2020-01-01" || recordedAt > todayInBrazil()) {
    return { error: "Data da coleta inválida (não pode ser no futuro)." };
  }
  if (!/^[a-f0-9]{64}$/.test(sha)) return { error: "Hash SHA-256 ausente ou inválido. Selecione a foto novamente." };
  if (exifDatetime && Number.isNaN(Date.parse(exifDatetime))) return { error: "Data EXIF inválida." };

  return {
    data: {
      brand,
      state_type: stateType,
      price_kind: priceKind as PriceKind,
      price_per_kg: price,
      market_name: market,
      city,
      state: uf,
      recorded_at: recordedAt,
      original_sha256: sha,
      exif_device: hasValidExif ? device : null,
      exif_datetime: hasValidExif ? exifDatetime : null,
      has_valid_exif: hasValidExif && Boolean(exifDatetime),
    },
  };
}
