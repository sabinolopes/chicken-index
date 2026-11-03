import { describe, expect, it } from "vitest";
import { computeKpis, weeklySeries, weekStart } from "@/modules/dashboard/stats";
import type { ChickenPrice, PriceKind } from "@/modules/prices/types";
import type { EconomicSettings } from "@/modules/settings/types";

const SETTINGS: EconomicSettings = { min_wage: 1500, avg_wage: 3000, updated_at: "2026-01-01T00:00:00Z" };

let sequence = 0;
function price(recordedAt: string, pricePerKg: number, options: { brand?: string; kind?: PriceKind; audited?: boolean } = {}): ChickenPrice {
  sequence += 1;
  return {
    id: `id-${sequence}`,
    brand: options.brand ?? "Sadia",
    state_type: "resfriado",
    price_kind: options.kind ?? "regular",
    price_per_kg: pricePerKg,
    market_name: "Mercado",
    city: "Itaperuna",
    state: "RJ",
    recorded_at: recordedAt,
    photo_url: "https://fotos.exemplo/foto.webp",
    original_sha256: String(sequence).padStart(64, "0"),
    exif_device: null,
    exif_datetime: null,
    has_valid_exif: options.audited ?? true,
    created_at: `${recordedAt}T12:00:00Z`,
  };
}

describe("weekStart", () => {
  it("leva qualquer dia para a segunda-feira da mesma semana", () => {
    expect(weekStart("2026-11-02")).toBe("2026-11-02"); // segunda
    expect(weekStart("2026-11-05")).toBe("2026-11-02"); // quinta
    expect(weekStart("2026-11-08")).toBe("2026-11-02"); // domingo fecha a semana
    expect(weekStart("2026-11-09")).toBe("2026-11-09");
  });

  it("atravessa a virada do mês e do ano", () => {
    expect(weekStart("2026-01-01")).toBe("2025-12-29");
  });
});

describe("weeklySeries", () => {
  it("agrupa por semana em ordem cronológica, com média geral e por marca", () => {
    const series = weeklySeries([
      price("2026-11-10", 24, { brand: "Seara" }),
      price("2026-11-03", 20),
      price("2026-11-04", 22),
      price("2026-11-05", 21, { brand: "Seara" }),
    ]);

    expect(series).toEqual([
      { week: "2026-11-02", average: 21, count: 3, byBrand: { Sadia: 21, Seara: 21 } },
      { week: "2026-11-09", average: 24, count: 1, byBrand: { Seara: 24 } },
    ]);
  });

  it("arredonda as médias em centavos", () => {
    const [week] = weeklySeries([price("2026-11-03", 20), price("2026-11-03", 20), price("2026-11-03", 21)]);
    expect(week.average).toBe(20.33);
  });
});

describe("computeKpis", () => {
  it("devolve null sem preços normais (ofertas não formam o índice)", () => {
    expect(computeKpis([], SETTINGS)).toBeNull();
    expect(computeKpis([price("2026-11-03", 15, { kind: "oferta" })], SETTINGS)).toBeNull();
  });

  it("calcula variação e poder de compra só com preços normais", () => {
    const kpis = computeKpis(
      [
        price("2026-11-03", 20),
        price("2026-11-10", 22),
        price("2026-11-17", 25),
        price("2026-11-17", 10, { kind: "clube", audited: false }), // fica fora das médias
      ],
      SETTINGS,
    );

    expect(kpis).toMatchObject({
      firstWeek: "2026-11-02",
      currentWeek: "2026-11-16",
      firstAvg: 20,
      previousAvg: 22,
      currentAvg: 25,
      accumulatedPct: 25,
      weeks: 3,
      records: 4,
      audited: 3,
      promoCount: 1,
      minWageKg: { start: 75, now: 60, deltaPct: -20 },
      avgWageKg: { start: 150, now: 120, deltaPct: -20 },
    });
    expect(kpis?.weeklyPct).toBeCloseTo(13.636, 3);
  });

  it("sem semana anterior, a variação semanal fica vazia", () => {
    const kpis = computeKpis([price("2026-11-03", 20)], SETTINGS);
    expect(kpis).toMatchObject({ previousAvg: null, weeklyPct: null, accumulatedPct: 0 });
  });
});
