import { describe, expect, it } from "vitest";
import { applyFilters, changeFilter, EMPTY_FILTERS, filterLabel, filterOptions } from "@/components/blocks/filters/filter-options";
import type { ChickenPrice } from "@/modules/prices/types";

const price = ({ state, city, market, brand = "Sadia" }: { state: string; city: string; market: string; brand?: string }) =>
  ({ state, city, market_name: market, brand }) as ChickenPrice;

const PRICES = [
  price({ state: "RJ", city: "Itaperuna", market: "Unidos" }),
  price({ state: "RJ", city: "Itaperuna", market: "Assaí", brand: "Seara" }),
  price({ state: "RJ", city: "Niterói", market: "Zona Sul" }),
  price({ state: "MG", city: "Muriaé", market: "Bahamas", brand: "Perdigão" }),
];

describe("filterOptions", () => {
  it("sem filtro, lista tudo em ordem alfabética", () => {
    expect(filterOptions(PRICES, EMPTY_FILTERS)).toEqual({
      states: ["MG", "RJ"],
      cities: ["Itaperuna", "Muriaé", "Niterói"],
      markets: ["Assaí", "Bahamas", "Unidos", "Zona Sul"],
      brands: ["Perdigão", "Sadia", "Seara"],
    });
  });

  it("em cascata: cidades da UF escolhida e mercados da cidade escolhida", () => {
    const options = filterOptions(PRICES, { ...EMPTY_FILTERS, state: "RJ", city: "Itaperuna" });
    expect(options.cities).toEqual(["Itaperuna", "Niterói"]);
    expect(options.markets).toEqual(["Assaí", "Unidos"]);
    expect(options.states).toEqual(["MG", "RJ"]);
  });
});

describe("changeFilter", () => {
  const chosen = { state: "RJ", city: "Itaperuna", market: "Unidos", brand: "Sadia" };

  it("trocar a UF limpa cidade e mercado, mas mantém a marca", () => {
    expect(changeFilter(chosen, "state", "MG")).toEqual({ state: "MG", city: "", market: "", brand: "Sadia" });
  });

  it("trocar a cidade limpa só o mercado", () => {
    expect(changeFilter(chosen, "city", "Niterói")).toEqual({ state: "RJ", city: "Niterói", market: "", brand: "Sadia" });
  });

  it("mercado e marca mudam sozinhos", () => {
    expect(changeFilter(chosen, "brand", "")).toEqual({ ...chosen, brand: "" });
    expect(changeFilter(chosen, "market", "Assaí")).toEqual({ ...chosen, market: "Assaí" });
  });
});

describe("applyFilters e filterLabel", () => {
  it("combina todos os filtros e descreve o recorte do mais específico para o mais geral", () => {
    const filters = { state: "RJ", city: "Itaperuna", market: "", brand: "Seara" };
    expect(applyFilters(PRICES, filters).map((item) => item.market_name)).toEqual(["Assaí"]);
    expect(filterLabel(filters)).toBe("Seara · Itaperuna");
    expect(filterLabel({ ...EMPTY_FILTERS, state: "MG" })).toBe("MG");
    expect(filterLabel(EMPTY_FILTERS)).toBe("");
  });
});
