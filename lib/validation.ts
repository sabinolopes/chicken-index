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

/** Lê os campos crus do formulário, já aparados e com tamanho limitado. */
function readPriceFields(form: FormData) {
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
  return { brand, stateType, priceKind, price, market, city, uf, recordedAt, sha, device, exifDatetime, hasValidExif };
}

const isOneOf = (list: readonly string[], value: string) => list.includes(value);
const isValidRecordedAt = (date: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= "2020-01-01" && date <= todayInBrazil();

/** Primeira regra violada, na ordem em que os campos aparecem no formulário; null se tudo estiver certo. */
function firstFieldError(fields: ReturnType<typeof readPriceFields>): string | null {
  const rules: [valid: boolean, message: string][] = [
    [isOneOf(BRANDS, fields.brand), "Selecione a marca."],
    [isOneOf(["resfriado", "congelado"], fields.stateType), "Selecione resfriado ou congelado."],
    [isOneOf(PRICE_KINDS, fields.priceKind), "Tipo de preço inválido."],
    [Number.isFinite(fields.price) && fields.price >= 1 && fields.price <= 500, "Preço por kg inválido (ex.: 21,99)."],
    [Boolean(fields.market), "Informe o mercado."],
    [Boolean(fields.city), "Informe a cidade."],
    [isOneOf(UFS, fields.uf), "Selecione o estado (UF)."],
    [isValidRecordedAt(fields.recordedAt), "Data da coleta inválida (não pode ser no futuro)."],
    [/^[a-f0-9]{64}$/.test(fields.sha), "Hash SHA-256 ausente ou inválido. Selecione a foto novamente."],
    [!fields.exifDatetime || !Number.isNaN(Date.parse(fields.exifDatetime)), "Data EXIF inválida."],
  ];
  return rules.find(([valid]) => !valid)?.[1] ?? null;
}

/** Valida os campos do formulário (roda de novo no servidor — nunca confiar no cliente). */
export function parsePriceForm(form: FormData): { data: PriceInput } | { error: string } {
  const fields = readPriceFields(form);
  const error = firstFieldError(fields);
  if (error) return { error };

  const { brand, stateType, priceKind, price, market, city, uf, recordedAt, sha, device, exifDatetime, hasValidExif } = fields;
  return {
    data: {
      brand,
      state_type: stateType as StateType,
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
