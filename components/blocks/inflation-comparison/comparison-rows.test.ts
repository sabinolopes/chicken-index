import { describe, expect, it } from "vitest";
import { comparisonPeriod, comparisonRows } from "@/components/blocks/inflation-comparison/comparison-rows";
import type { InflationComparison } from "@/modules/inflation/compare";

const period: InflationComparison = { kind: "period", from: "2026-11", to: "2026-12", frangometro: 5, general: 1.5, food: 3, chicken: 2 };
const reference: InflationComparison = { kind: "reference", awaiting: "2026-11", month: "2026-09", general: 4.3, food: 5.2, chicken: 2.9 };

describe("comparisonRows", () => {
  it("com meses em comum, o Frangômetro vem primeiro e em destaque", () => {
    expect(comparisonRows(period).map(({ label, pct, own }) => [label, pct, own])).toEqual([
      ["Frangômetro · peito de frango", 5, true],
      ["IPCA · Frango em pedaços", 2, false],
      ["IPCA · Alimentação e bebidas", 3, false],
      ["IPCA · Índice geral", 1.5, false],
    ]);
  });

  it("sem meses em comum, mostra só o IPCA (não compara períodos diferentes)", () => {
    expect(comparisonRows(reference).some((row) => row.own)).toBe(false);
  });
});

describe("comparisonPeriod", () => {
  it("diz o período comparado", () => {
    expect(comparisonPeriod(period)).toBe("Variação acumulada em nov/2026 a dez/2026, últimos dados publicados pelo IBGE.");
    expect(comparisonPeriod({ ...period, from: "2026-12" })).toBe("Variação acumulada em dez/2026, últimos dados publicados pelo IBGE.");
  });

  it("explica por que ainda não há comparação", () => {
    expect(comparisonPeriod(reference)).toContain("O IPCA de nov/2026, primeiro mês do Frangômetro, ainda não foi publicado");
    expect(comparisonPeriod(reference)).toContain("acumulado em 12 meses até set/2026");
  });
});
