import type { ChickenPrice, EconomicSettings } from "./types";

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
  minWageKg: { start: number; now: number; deltaPct: number };
  avgWageKg: { start: number; now: number; deltaPct: number };
}

/** Segunda-feira da semana de uma data ISO (YYYY-MM-DD). */
export function weekStart(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  const day = d.getUTCDay(); // 0 = domingo
  d.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
  return d.toISOString().slice(0, 10);
}

const mean = (values: number[]) => values.reduce((s, v) => s + v, 0) / values.length;
const round2 = (v: number) => Math.round(v * 100) / 100;

export function weeklySeries(prices: ChickenPrice[]): WeeklyPoint[] {
  const groups = new Map<string, ChickenPrice[]>();
  for (const p of prices) {
    const key = weekStart(p.recorded_at);
    const list = groups.get(key);
    if (list) list.push(p);
    else groups.set(key, [p]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, rows]) => {
      const brands = new Map<string, number[]>();
      for (const r of rows) {
        const list = brands.get(r.brand);
        if (list) list.push(r.price_per_kg);
        else brands.set(r.brand, [r.price_per_kg]);
      }
      const byBrand: Record<string, number> = {};
      for (const [brand, values] of brands) byBrand[brand] = round2(mean(values));
      return { week, average: round2(mean(rows.map((r) => r.price_per_kg))), count: rows.length, byBrand };
    });
}

function kgComparison(wage: number, startPrice: number, nowPrice: number) {
  const start = wage / startPrice;
  const now = wage / nowPrice;
  return { start, now, deltaPct: ((now - start) / start) * 100 };
}

export function computeKpis(prices: ChickenPrice[], settings: EconomicSettings): Kpis | null {
  const series = weeklySeries(prices);
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
    audited: prices.filter((p) => p.has_valid_exif).length,
    minWageKg: kgComparison(settings.min_wage, first.average, current.average),
    avgWageKg: kgComparison(settings.avg_wage, first.average, current.average),
  };
}
