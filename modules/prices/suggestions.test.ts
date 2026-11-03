import { describe, expect, it } from "vitest";
import { otherBrands, uniqueMarkets } from "@/modules/prices/suggestions";

describe("uniqueMarkets", () => {
  it("lista cada mercado uma vez, com o local do cadastro mais recente, em ordem alfabética", () => {
    const newestFirst = [
      { market_name: "Unidos", city: "Campos dos Goytacazes", state: "RJ" },
      { market_name: "Assaí", city: "Itaperuna", state: "RJ" },
      { market_name: "Unidos", city: "Itaperuna", state: "RJ" },
    ];

    expect(uniqueMarkets(newestFirst)).toEqual([
      { market_name: "Assaí", city: "Itaperuna", state: "RJ" },
      { market_name: "Unidos", city: "Campos dos Goytacazes", state: "RJ" },
    ]);
  });

  it("ordena com acentos do português (Ébano depois de Assaí, antes de Zona Sul)", () => {
    const names = uniqueMarkets([
      { market_name: "Zona Sul", city: "Rio de Janeiro", state: "RJ" },
      { market_name: "Ébano", city: "Niterói", state: "RJ" },
      { market_name: "Assaí", city: "Itaperuna", state: "RJ" },
    ]).map((suggestion) => suggestion.market_name);

    expect(names).toEqual(["Assaí", "Ébano", "Zona Sul"]);
  });
});

describe("otherBrands", () => {
  it("sugere só as marcas digitadas antes, sem repetir, em ordem alfabética", () => {
    expect(otherBrands(["Sadia", "Oi Frango", "Outra", "Ki Frango", "Oi Frango", "Seara"])).toEqual(["Ki Frango", "Oi Frango"]);
  });
});
