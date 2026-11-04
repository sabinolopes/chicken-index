import type { PriceFields } from "@/components/blocks/new-price-form";
import { centsFromNumber } from "@/lib/format";
import { localIsoDate } from "@/modules/photos/process-photo";
import { isMainBrand, OTHER_BRAND, type ChickenPrice } from "@/modules/prices/types";

/** Campos do formulário preenchidos com o cadastro atual (marca fora das principais abre em "Outra"). */
export function fieldsFromPrice(price: ChickenPrice): PriceFields {
  const mainBrand = isMainBrand(price.brand);
  return {
    price: centsFromNumber(price.price_per_kg),
    brand: mainBrand ? price.brand : OTHER_BRAND,
    otherBrand: mainBrand ? "" : price.brand,
    stateType: price.state_type,
    priceKind: price.price_kind,
    market: price.market_name,
    city: price.city,
    uf: price.state,
    recordedAt: price.recorded_at,
  };
}

/** Dia em que a câmera registrou a foto (YYYY-MM-DD), para avisar se a data corrigida divergir. */
export function photoDayOf(price: Pick<ChickenPrice, "has_valid_exif" | "exif_datetime">): string | null {
  if (!price.has_valid_exif || !price.exif_datetime) return null;
  return localIsoDate(new Date(price.exif_datetime));
}
