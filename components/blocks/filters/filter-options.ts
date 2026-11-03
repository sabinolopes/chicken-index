import type { ChickenPrice } from "@/modules/prices/types";

export interface FilterState {
  state: string;
  city: string;
  market: string;
  brand: string;
}

export const EMPTY_FILTERS: FilterState = { state: "", city: "", market: "", brand: "" };

const uniqueSorted = (values: string[]) => [...new Set(values)].sort((first, second) => first.localeCompare(second, "pt-BR"));

/**
 * Opções de cada filtro em cascata: cidades só da UF escolhida, mercados só da cidade
 * escolhida. UF e marca sempre mostram todas as opções.
 */
export function filterOptions(prices: ChickenPrice[], filters: FilterState) {
  const inState = prices.filter((price) => !filters.state || price.state === filters.state);
  const inCity = inState.filter((price) => !filters.city || price.city === filters.city);
  return {
    states: uniqueSorted(prices.map((price) => price.state)),
    cities: uniqueSorted(inState.map((price) => price.city)),
    markets: uniqueSorted(inCity.map((price) => price.market_name)),
    brands: uniqueSorted(prices.map((price) => price.brand)),
  };
}

/** Trocar a UF limpa cidade e mercado; trocar a cidade limpa o mercado (evita combinação impossível). */
export function changeFilter(filters: FilterState, field: keyof FilterState, value: string): FilterState {
  if (field === "state") return { ...filters, state: value, city: "", market: "" };
  if (field === "city") return { ...filters, city: value, market: "" };
  return { ...filters, [field]: value };
}

export function applyFilters(prices: ChickenPrice[], filters: FilterState) {
  return prices.filter(
    (price) =>
      (!filters.state || price.state === filters.state) &&
      (!filters.city || price.city === filters.city) &&
      (!filters.market || price.market_name === filters.market) &&
      (!filters.brand || price.brand === filters.brand),
  );
}

/** Texto do recorte atual para o card de compartilhamento (ex.: "Sadia · Unidos · Itaperuna"). */
export const filterLabel = (filters: FilterState) => [filters.brand, filters.market, filters.city || filters.state].filter(Boolean).join(" · ");
