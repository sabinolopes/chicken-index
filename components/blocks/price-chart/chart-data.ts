import { formatShortDate } from "@/lib/format";
import type { WeeklyPoint } from "@/modules/dashboard/stats";
import { BRANDS, OTHER_BRAND } from "@/modules/prices/types";

export const AVG_KEY = "Média geral";
export const PROMO_KEY = "Promoções (média)";

// Cor segue a marca (nunca a posição), para não repintar ao filtrar.
export const BRAND_COLORS: Record<string, string> = {
  Sadia: "var(--series-1)",
  Seara: "var(--series-2)",
  Perdigão: "var(--series-3)",
  "Pif Paf": "var(--series-7)",
  Outra: "var(--series-4)",
};

/** Nome da série na legenda, na tabela e na dica: o grupo "Outra" junta várias marcas. */
export const brandLabel = (brand: string) => (brand === OTHER_BRAND ? "Outras marcas" : brand);

export type ChartRow = { week: string; label: string } & Record<string, number | string | undefined>;

/** Marcas com algum preço no recorte, na ordem fixa de `BRANDS`. */
export const brandsInSeries = (series: WeeklyPoint[]) => BRANDS.filter((brand) => series.some((point) => point.byBrand[brand] !== undefined));

/** Uma linha por semana com média, marcas e promoções. Semanas só com promoção também entram (sem média geral). */
export function chartRows(series: WeeklyPoint[], promoSeries: WeeklyPoint[]): ChartRow[] {
  const weeks = [...new Set([...series, ...promoSeries].map((point) => point.week))].sort();
  const regularByWeek = new Map(series.map((point) => [point.week, point]));
  const promoByWeek = new Map(promoSeries.map((point) => [point.week, point]));
  return weeks.map((week) => {
    const regular = regularByWeek.get(week);
    return {
      week,
      label: formatShortDate(week),
      [AVG_KEY]: regular?.average,
      [PROMO_KEY]: promoByWeek.get(week)?.average,
      ...regular?.byBrand,
    };
  });
}

/** Eixo Y com passo inteiro e uniforme (o automático do Recharts pula valores): R$ 1 ou R$ 2 por marca. */
export function priceAxis(rows: ChartRow[]): { domain: [number, number]; ticks: number[] } {
  const values = rows.flatMap((row) => Object.values(row).filter((value): value is number => typeof value === "number"));
  if (values.length === 0) return { domain: [0, 1], ticks: [0, 1] };

  const lowest = Math.min(...values);
  const highest = Math.max(...values);
  const step = highest - lowest > 6 ? 2 : 1;
  const lowerBound = Math.floor((lowest - 0.5) / step) * step;
  const upperBound = Math.ceil((highest + 0.5) / step) * step;
  const ticks: number[] = [];
  for (let tick = lowerBound; tick <= upperBound; tick += step) ticks.push(tick);
  return { domain: [lowerBound, upperBound], ticks };
}
