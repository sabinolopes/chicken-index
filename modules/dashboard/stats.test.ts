import { describe, expect, it } from "vitest";
import { computeKpis, sameProductIndex, weeklySeries, weekStart } from "@/modules/dashboard/stats";
import type { ChickenPrice, PriceKind } from "@/modules/prices/types";
import type { EconomicSettings } from "@/modules/settings/types";

const SETTINGS: EconomicSettings = { min_wage: 1500, avg_wage: 3000, updated_at: "2026-01-01T00:00:00Z" };

let sequence = 0;
function price(recordedAt: string, pricePerKg: number, options: { brand?: string; kind?: PriceKind; audited?: boolean; market?: string } = {}): ChickenPrice {
  sequence += 1;
  return {
    id: `id-${sequence}`,
    brand: options.brand ?? "Sadia",
    state_type: "resfriado",
    price_kind: options.kind ?? "regular",
    price_per_kg: pricePerKg,
    market_name: options.market ?? "Mercado",
    city: "Itaperuna",
    state: "RJ",
    recorded_at: recordedAt,
    photo_url: "https://fotos.exemplo/foto.webp",
    original_sha256: String(sequence).padStart(64, "0"),
    exif_device: null,
    exif_datetime: null,
    has_valid_exif: options.audited ?? true,
    created_at: `${recordedAt}T12:00:00Z`,
    updated_at: null,
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

  it("marcas digitadas em 'Outra' somam no mesmo grupo do gráfico", () => {
    const [week] = weeklySeries([
      price("2026-11-03", 18, { brand: "Oi Frango" }),
      price("2026-11-03", 20, { brand: "Ki Frango" }),
      price("2026-11-03", 22, { brand: "Sadia" }),
    ]);
    expect(week.byBrand).toEqual({ Outra: 19, Sadia: 22 });
    expect(week.average).toBe(20);
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
      currentAvg: 25,
      weeks: 3,
      records: 4,
      audited: 3,
      promoCount: 1,
    });
    expect(kpis?.accumulatedPct).toBeCloseTo(25, 9);
    expect(kpis?.weeklyPct).toBeCloseTo(13.636, 3);
    expect([kpis?.minWageKg.start, kpis?.minWageKg.now, kpis?.minWageKg.deltaPct]).toEqual([75, expect.closeTo(60, 9), expect.closeTo(-20, 9)]);
    expect([kpis?.avgWageKg.start, kpis?.avgWageKg.now]).toEqual([150, expect.closeTo(120, 9)]);
  });

  it("sem semana anterior, a variação semanal fica vazia", () => {
    const kpis = computeKpis([price("2026-11-03", 20)], SETTINGS);
    expect(kpis).toMatchObject({ weeklyPct: null, accumulatedPct: 0 });
  });
});

describe("sameProductIndex (mesmo mercado, marca e tipo)", () => {
  it("não sobe só porque a semana coletou um mercado mais caro", () => {
    const points = sameProductIndex([
      price("2026-11-03", 18, { market: "Assaí" }),
      price("2026-11-03", 22, { market: "Lizeu" }),
      price("2026-11-10", 22, { market: "Lizeu" }),
    ]);

    expect(points).toEqual([
      { week: "2026-11-02", index: 100, compared: 0 },
      { week: "2026-11-09", index: 100, compared: 1 },
    ]);
  });

  it("junta as variações de cada produto pela média geométrica, como o IPCA", () => {
    const points = sameProductIndex([
      price("2026-11-03", 20, { market: "Assaí" }),
      price("2026-11-03", 20, { market: "Lizeu" }),
      price("2026-11-10", 22, { market: "Assaí" }), // +10%
      price("2026-11-10", 18, { market: "Lizeu" }), // -10%
    ]);

    expect(points[1].index).toBeCloseTo(100 * Math.sqrt(1.1 * 0.9), 6);
    expect(points[1].compared).toBe(2);
  });

  it("produto que pulou semanas é comparado com o último preço dele", () => {
    const points = sameProductIndex([
      price("2026-11-03", 20, { market: "Assaí" }),
      price("2026-11-03", 30, { market: "Lizeu" }),
      price("2026-11-10", 30, { market: "Lizeu" }),
      price("2026-11-17", 25, { market: "Assaí" }), // +25% desde 03/11
    ]);

    expect(points.map((point) => point.index)).toEqual([100, 100, 125]);
  });

  it("mesma marca em resfriado e congelado, ou com outra marca, são produtos diferentes", () => {
    const frozen = { ...price("2026-11-10", 30), state_type: "congelado" as const };
    const points = sameProductIndex([price("2026-11-03", 20), frozen, price("2026-11-10", 40, { brand: "Seara" })]);
    expect(points[1]).toEqual({ week: "2026-11-09", index: 100, compared: 0 });
  });

  it("reconhece o mesmo mercado digitado com caixa ou espaços diferentes", () => {
    const points = sameProductIndex([price("2026-11-03", 20, { market: "Lizeu" }), price("2026-11-10", 21, { market: " lizeu " })]);
    expect(points[1]).toEqual({ week: "2026-11-09", index: 105, compared: 1 });
  });

  it("vários registros do mesmo produto na semana viram um preço só (a média)", () => {
    const points = sameProductIndex([price("2026-11-03", 20), price("2026-11-10", 21), price("2026-11-10", 23)]);
    expect(points[1].index).toBeCloseTo(110, 6);
  });
});

describe("computeKpis com o índice de mesmos produtos", () => {
  it("variação e poder de compra seguem o índice, não a média de quem foi coletado", () => {
    const kpis = computeKpis(
      [
        price("2026-11-03", 18, { market: "Assaí" }),
        price("2026-11-03", 22, { market: "Lizeu" }),
        price("2026-11-10", 22, { market: "Lizeu" }),
      ],
      SETTINGS,
    );

    expect(kpis).toMatchObject({ firstAvg: 20, currentAvg: 22, accumulatedPct: 0, weeklyPct: 0, comparedProducts: 1 });
    expect(kpis?.minWageKg).toEqual({ start: 75, now: 75, deltaPct: 0 });
  });

  it("sem nenhum produto repetido na última semana, a variação semanal fica vazia em vez de 0%", () => {
    const kpis = computeKpis([price("2026-11-03", 20, { market: "Assaí" }), price("2026-11-10", 25, { market: "Lizeu" })], SETTINGS);
    expect(kpis).toMatchObject({ weeklyPct: null, comparedProducts: 0, accumulatedPct: 0 });
  });
});
