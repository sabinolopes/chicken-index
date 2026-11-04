import type { ProcessedPhoto, ProcessStep } from "@/modules/photos/process-photo";
import type { MarketSuggestion } from "@/modules/prices/suggestions";
import { normalizeBrand, OTHER_BRAND, type PriceKind, type StateType } from "@/modules/prices/types";

/** Campos digitados/escolhidos no formulário (a foto e o EXIF vêm do processamento). */
export interface PriceFields {
  price: string;
  /** Botão escolhido (uma das marcas principais ou "Outra"). */
  brand: string;
  /** Marca digitada quando o botão é "Outra" (Oi Frango, Ki Frango...). */
  otherBrand: string;
  stateType: StateType;
  priceKind: PriceKind;
  market: string;
  city: string;
  uf: string;
  recordedAt: string;
}

export const EMPTY_FIELDS: PriceFields = {
  price: "",
  brand: "",
  otherBrand: "",
  stateType: "resfriado",
  priceKind: "regular",
  market: "",
  city: "",
  uf: "",
  recordedAt: "",
};

export const STEP_LABEL: Record<ProcessStep, string> = {
  hash: "Calculando SHA-256 do original…",
  exif: "Lendo metadados EXIF…",
  compress: "Comprimindo para .webp…",
};

// Rótulos curtos dos botões (cabem em três colunas no celular) e a explicação de cada tipo.
export const PRICE_KIND_SHORT_LABEL: Record<PriceKind, string> = { regular: "Normal", oferta: "Oferta", clube: "Clube" };
export const PRICE_KIND_HINT: Record<PriceKind, string> = {
  regular: "Preço de gôndola para qualquer cliente. Só esse entra no índice de inflação.",
  oferta: "Promoção temporária. Aparece no site, mas fica fora do índice.",
  clube: "Preço exclusivo para quem tem cadastro/app do mercado. Aparece no site, mas fica fora do índice.",
};

/** Foto tirada há mais dias que isso ganha aviso (pode ser de outra semana). */
export const OLD_PHOTO_DAYS = 3;

/** Faixa plausível do kg do peito de frango; fora dela, avisa (provável preço da bandeja ou erro de digitação). */
const PLAUSIBLE_PRICE = { min: 8, max: 60 };

export const priceLooksWrong = (price: number) => price > 0 && (price < PLAUSIBLE_PRICE.min || price > PLAUSIBLE_PRICE.max);

/** A data informada é diferente do dia em que a câmera registrou a foto. */
export const dateDiffersFromPhoto = (photoDay: string | null, recordedAt: string) => photoDay !== null && recordedAt !== "" && photoDay !== recordedAt;

/** Marca que vai para o servidor: a do botão, ou a digitada quando o botão é "Outra". */
export const resolvedBrand = (fields: Pick<PriceFields, "brand" | "otherBrand">) =>
  fields.brand === OTHER_BRAND ? normalizeBrand(fields.otherBrand) : fields.brand;

/** Botão "Publicar" só libera com foto pronta e todos os campos preenchidos (inclusive a marca digitada). */
export function isReadyToSubmit({ fields, parsedPrice, photoReady }: { fields: PriceFields; parsedPrice: number; photoReady: boolean }) {
  const brandReady = resolvedBrand(fields).length >= 2;
  return photoReady && parsedPrice > 0 && brandReady && Boolean(fields.market.trim() && fields.city.trim() && fields.uf && fields.recordedAt);
}

/** Junta ao formulário a foto comprimida e a prova de auditoria calculada no navegador. */
export function appendPhoto(formData: FormData, photo: ProcessedPhoto) {
  const extension = photo.compressed.type === "image/webp" ? "webp" : "jpg";
  formData.set("photo", new File([photo.compressed], `etiqueta.${extension}`, { type: photo.compressed.type }));
  formData.set("original_sha256", photo.sha256);
  formData.set("has_valid_exif", String(photo.hasValidExif));
  formData.set("exif_device", photo.exif.device ?? "");
  formData.set("exif_datetime", photo.exif.datetime?.toISOString() ?? "");
  return formData;
}

/** Mercados e cidades já usados, para o autocompletar. */
export function placeOptions(suggestions: MarketSuggestion[]) {
  return {
    markets: [...new Set(suggestions.map((suggestion) => suggestion.market_name))],
    cities: [...new Set(suggestions.map((suggestion) => suggestion.city))],
  };
}

export const formatKilobytes = (bytes: number) => `${Math.round(bytes / 1024).toLocaleString("pt-BR")} KB`;
