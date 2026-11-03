import { brandGroup, type ChickenPrice } from "@/modules/prices/types";
import type { EconomicSettings } from "@/modules/settings/types";

export interface WeeklyPoint {
  week: string; // segunda-feira da semana (YYYY-MM-DD)
  average: number;
  count: number;
  byBrand: Record<string, number>;
}

export interface Kpis {
  currentAvg: number;
  firstAvg: number;
  previousAvg: number | null;
  accumulatedPct: number;
  weeklyPct: number | null;
  firstWeek: string;
  currentWeek: string;
  weeks: number;
  records: number;
  audited: number;
  /** Registros de oferta/clube no recorte, fora do índice. */
  promoCount: number;
  minWageKg: { start: number; now: number; deltaPct: number };
  avgWageKg: { start: number; now: number; deltaPct: number };
}

/** Segunda-feira da semana de uma data ISO (YYYY-MM-DD). */
export function weekStart(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  const day = date.getUTCDay(); // 0 = domingo
  date.setUTCDate(date.getUTCDate() - ((day + 6) % 7));
  return date.toISOString().slice(0, 10);
}

const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const round2 = (value: number) => Math.round(value * 100) / 100;

export function weeklySeries(prices: ChickenPrice[]): WeeklyPoint[] {
  const groups = new Map<string, ChickenPrice[]>();
  for (const price of prices) {
    const key = weekStart(price.recorded_at);
    const list = groups.get(key);
    if (list) list.push(price);
    else groups.set(key, [price]);
  }

  return [...groups.entries()]
    .sort(([firstWeek], [secondWeek]) => firstWeek.localeCompare(secondWeek))
    .map(([week, rows]) => {
      // Oi Frango, Ki Frango etc. somam no grupo "Outra" (o gráfico tem cor fixa só para as principais).
      const brands = new Map<string, number[]>();
      for (const row of rows) {
        const group = brandGroup(row.brand);
        const list = brands.get(group);
        if (list) list.push(row.price_per_kg);
        else brands.set(group, [row.price_per_kg]);
      }
      const byBrand: Record<string, number> = {};
      for (const [brand, values] of brands) byBrand[brand] = round2(mean(values));
      return { week, average: round2(mean(rows.map((row) => row.price_per_kg))), count: rows.length, byBrand };
    });
}

function kgComparison(wage: number, startPrice: number, nowPrice: number) {
  const start = wage / startPrice;
  const now = wage / nowPrice;
  return { start, now, deltaPct: ((now - start) / start) * 100 };
}

/** Preços que entram no índice: só o preço normal de gôndola (ofertas e clube ficam de fora). */
export const isIndexPrice = (price: ChickenPrice) => price.price_kind === "regular";

/**
 * KPIs do índice. As médias usam só preços normais; as contagens de registros e
 * fotos auditadas consideram todos os registros do recorte.
 */
export function computeKpis(prices: ChickenPrice[], settings: EconomicSettings): Kpis | null {
  const indexPrices = prices.filter(isIndexPrice);
  const series = weeklySeries(indexPrices);
  if (series.length === 0) return null;

  const first = series[0];
  const current = series[series.length - 1];
  const previous = series.length > 1 ? series[series.length - 2] : null;

  return {
    currentAvg: current.average,
    firstAvg: first.average,
    previousAvg: previous?.average ?? null,
    accumulatedPct: ((current.average - first.average) / first.average) * 100,
    weeklyPct: previous ? ((current.average - previous.average) / previous.average) * 100 : null,
    firstWeek: first.week,
    currentWeek: current.week,
    weeks: series.length,
    records: prices.length,
    audited: prices.filter((price) => price.has_valid_exif).length,
    promoCount: prices.length - indexPrices.length,
    minWageKg: kgComparison(settings.min_wage, first.average, current.average),
    avgWageKg: kgComparison(settings.avg_wage, first.average, current.average),
  };
}
