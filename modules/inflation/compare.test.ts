import { describe, expect, it } from "vitest";
import { compareWithIpca, formatMonth } from "@/modules/inflation/compare";
import type { OfficialInflation } from "@/modules/inflation/types";

const inflation: OfficialInflation = {
  months: [
    { month: "2026-10", general: 0.5, food: 1, chicken: 2 },
    { month: "2026-11", general: 0.5, food: 1, chicken: -1 },
    { month: "2026-12", general: 1, food: 2, chicken: 3 },
  ],
  twelveMonths: { month: "2026-12", general: 4.3, food: 5.2, chicken: 2.9 },
};

describe("compareWithIpca", () => {
  it("acumula o IPCA dos meses em comum e lê o índice do Frangômetro no último deles", () => {
    const index = [
      { week: "2026-11-02", index: 100, compared: 0 },
      { week: "2026-11-30", index: 103, compared: 2 },
      { week: "2026-12-28", index: 105, compared: 2 },
      { week: "2027-01-04", index: 110, compared: 2 }, // janeiro: IBGE ainda não publicou
    ];

    const comparison = compareWithIpca(inflation, index);

    expect(comparison).toMatchObject({ kind: "period", from: "2026-11", to: "2026-12", frangometro: 5 });
    expect(comparison?.kind === "period" && comparison.general).toBeCloseTo((1.005 * 1.01 - 1) * 100, 9);
    expect(comparison?.kind === "period" && comparison.chicken).toBeCloseTo((0.99 * 1.03 - 1) * 100, 9);
  });

  it("antes de o IBGE publicar o 1º mês da coleta, mostra o acumulado em 12 meses como referência", () => {
    const comparison = compareWithIpca(inflation, [{ week: "2027-01-04", index: 100, compared: 0 }]);
    expect(comparison).toEqual({ kind: "reference", awaiting: "2027-01", month: "2026-12", general: 4.3, food: 5.2, chicken: 2.9 });
  });

  it("sem dados do Frangômetro, não há o que comparar", () => {
    expect(compareWithIpca(inflation, [])).toBeNull();
  });
});

describe("formatMonth", () => {
  it("escreve o mês como no resto do site", () => {
    expect(formatMonth("2026-09")).toBe("set/2026");
    expect(formatMonth("2027-01")).toBe("jan/2027");
  });
});
