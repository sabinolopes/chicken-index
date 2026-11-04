import { parsePrice, todayInBrazil } from "@/lib/parse";
import { normalizeBrand, OTHER_BRAND, PRICE_KINDS, type PriceKind, type StateType } from "./types";

export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
  "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;

// A foto chega já comprimida pelo navegador (~150 KB); 1 MB é folga para o JPEG de fallback.
export const MAX_PHOTO_BYTES = 1024 * 1024;
const PHOTO_MIME_TYPES = ["image/webp", "image/jpeg"];

/** Confere a foto comprimida enviada no formulário (tipo e tamanho), sem confiar no cliente. */
export function parsePhotoFile(value: FormDataEntryValue | null): { file: File } | { error: string } {
  if (!(value instanceof File) || value.size === 0) return { error: "Foto comprimida ausente." };
  if (!PHOTO_MIME_TYPES.includes(value.type)) return { error: "A foto deve estar em .webp ou .jpg." };
  if (value.size > MAX_PHOTO_BYTES) return { error: "Foto comprimida maior que 1 MB." };
  return { file: value };
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

/** Dados da etiqueta que o admin pode corrigir depois; foto, hash e EXIF são a prova e não mudam. */
export type PriceDetails = Pick<
  PriceInput,
  "brand" | "state_type" | "price_kind" | "price_per_kg" | "market_name" | "city" | "state" | "recorded_at"
>;

const text = (value: FormDataEntryValue | null, max = 80) => String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max);

/** Lê os campos crus do formulário, já aparados e com tamanho limitado. */
function readPriceFields(form: FormData) {
  const brand = normalizeBrand(text(form.get("brand")));
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

type PriceFields = ReturnType<typeof readPriceFields>;
type Rule = [valid: boolean, message: string];

const firstBroken = (rules: Rule[]) => rules.find(([valid]) => !valid)?.[1] ?? null;

/** Primeira regra violada nos dados da etiqueta, na ordem do formulário; null se tudo estiver certo. */
function detailsError(fields: PriceFields): string | null {
  return firstBroken([
    [Boolean(fields.brand), "Selecione a marca."],
    // "Outra" sozinha não diz nada: o formulário manda a marca digitada no lugar dela.
    [fields.brand !== OTHER_BRAND, "Digite qual é a marca."],
    [fields.brand.length >= 2, "Nome da marca muito curto."],
    [isOneOf(["resfriado", "congelado"], fields.stateType), "Selecione resfriado ou congelado."],
    [isOneOf(PRICE_KINDS, fields.priceKind), "Tipo de preço inválido."],
    [Number.isFinite(fields.price) && fields.price >= 1 && fields.price <= 500, "Preço por kg inválido (ex.: 21,99)."],
    [Boolean(fields.market), "Informe o mercado."],
    [Boolean(fields.city), "Informe a cidade."],
    [isOneOf(UFS, fields.uf), "Selecione o estado (UF)."],
    [isValidRecordedAt(fields.recordedAt), "Data da coleta inválida (não pode ser no futuro)."],
  ]);
}

/** Primeira regra violada na prova de auditoria da foto (hash e EXIF). */
function proofError(fields: PriceFields): string | null {
  return firstBroken([
    [/^[a-f0-9]{64}$/.test(fields.sha), "Hash SHA-256 ausente ou inválido. Selecione a foto novamente."],
    [!fields.exifDatetime || !Number.isNaN(Date.parse(fields.exifDatetime)), "Data EXIF inválida."],
  ]);
}

const toDetails = (fields: PriceFields): PriceDetails => ({
  brand: fields.brand,
  state_type: fields.stateType as StateType,
  price_kind: fields.priceKind as PriceKind,
  price_per_kg: fields.price,
  market_name: fields.market,
  city: fields.city,
  state: fields.uf,
  recorded_at: fields.recordedAt,
});

/** Valida os campos do formulário (roda de novo no servidor — nunca confiar no cliente). */
export function parsePriceForm(form: FormData): { data: PriceInput } | { error: string } {
  const fields = readPriceFields(form);
  const error = detailsError(fields) ?? proofError(fields);
  if (error) return { error };

  const { sha, device, exifDatetime, hasValidExif } = fields;
  return {
    data: {
      ...toDetails(fields),
      original_sha256: sha,
      exif_device: hasValidExif ? device : null,
      exif_datetime: hasValidExif ? exifDatetime : null,
      has_valid_exif: hasValidExif && Boolean(exifDatetime),
    },
  };
}

/** Valida a correção de um cadastro: só os dados da etiqueta, com as mesmas regras do cadastro. */
export function parsePriceDetails(form: FormData): { data: PriceDetails } | { error: string } {
  const fields = readPriceFields(form);
  const error = detailsError(fields);
  if (error) return { error };
  return { data: toDetails(fields) };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** O id chega do navegador: só segue adiante se tiver o formato de um id do banco. */
export const isPriceId = (id: unknown): id is string => typeof id === "string" && UUID.test(id);
