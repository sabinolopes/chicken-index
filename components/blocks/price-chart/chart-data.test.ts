import { describe, expect, it } from "vitest";
import { AVG_KEY, brandsInSeries, chartRows, priceAxis, PROMO_KEY } from "@/components/blocks/price-chart/chart-data";
import type { WeeklyPoint } from "@/modules/dashboard/stats";

const point = (week: string, average: number, byBrand: Record<string, number> = {}): WeeklyPoint => ({ week, average, count: 1, byBrand });

describe("chartRows", () => {
  it("junta preço normal e promoções por semana, incluindo semana só com promoção", () => {
    const rows = chartRows([point("2026-11-02", 21, { Sadia: 21 }), point("2026-11-16", 23, { Seara: 23 })], [point("2026-11-09", 17)]);

    expect(rows.map((row) => [row.week, row.label, row[AVG_KEY], row[PROMO_KEY]])).toEqual([
      ["2026-11-02", "02/nov", 21, undefined],
      ["2026-11-09", "09/nov", undefined, 17],
      ["2026-11-16", "16/nov", 23, undefined],
    ]);
    expect(rows[0].Sadia).toBe(21);
  });
});

describe("brandsInSeries", () => {
  it("mantém a ordem fixa das marcas (a cor não muda quando o filtro muda)", () => {
    expect(brandsInSeries([point("2026-11-02", 21, { Outra: 20, Sadia: 22 })])).toEqual(["Sadia", "Outra"]);
  });
});

describe("priceAxis", () => {
  it("usa passo de R$ 1 com folga acima e abaixo quando a variação é pequena", () => {
    const axis = priceAxis(chartRows([point("2026-11-02", 21.2), point("2026-11-09", 23.9)], []));
    expect(axis).toEqual({ domain: [20, 25], ticks: [20, 21, 22, 23, 24, 25] });
  });

  it("usa passo de R$ 2 quando a variação passa de R$ 6", () => {
    const axis = priceAxis(chartRows([point("2026-11-02", 15)], [point("2026-11-02", 24)]));
    expect(axis.ticks).toEqual([14, 16, 18, 20, 22, 24, 26]);
  });

  it("sem dados, devolve um eixo neutro em vez de quebrar", () => {
    expect(priceAxis([])).toEqual({ domain: [0, 1], ticks: [0, 1] });
  });
});
