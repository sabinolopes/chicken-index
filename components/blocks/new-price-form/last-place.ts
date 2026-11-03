import type { MarketSuggestion } from "@/modules/prices/suggestions";

const LAST_PLACE_KEY = "admin:last-place";

type PlaceStorage = Pick<Storage, "getItem" | "setItem">;

const browserStorage = (): PlaceStorage | null => (typeof localStorage === "undefined" ? null : localStorage);

/**
 * Último mercado usado neste aparelho: o admin costuma fotografar vários preços no mesmo
 * lugar. Sem armazenamento (aba anônima) ou com dado corrompido, devolve null.
 */
export function readLastPlace(storage: PlaceStorage | null = browserStorage()): MarketSuggestion | null {
  try {
    const raw = storage?.getItem(LAST_PLACE_KEY);
    if (!raw) return null;
    const place = JSON.parse(raw) as Partial<MarketSuggestion>;
    if (!place.market_name || !place.city || !place.state) return null;
    return { market_name: place.market_name, city: place.city, state: place.state };
  } catch {
    return null;
  }
}

export function rememberLastPlace(place: MarketSuggestion, storage: PlaceStorage | null = browserStorage()) {
  try {
    storage?.setItem(LAST_PLACE_KEY, JSON.stringify(place));
  } catch {
    // armazenamento indisponível (aba anônima ou cota cheia): só perde a sugestão
  }
}
