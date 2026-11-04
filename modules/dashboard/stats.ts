import { brandGroup, type ChickenPrice } from "@/modules/prices/types";
import type { EconomicSettings } from "@/modules/settings/types";

export interface WeeklyPoint {
  week: string; // segunda-feira da semana (YYYY-MM-DD)
  average: number;
  count: number;
  byBrand: Record<string, number>;
}

/** Ponto do índice de mesmos produtos: 100 na primeira semana. */
export interface IndexPoint {
  week: string;
  index: number;
  /** Produtos da semana que já tinham preço antes (os que entram na conta). */
  compared: number;
}

export interface Kpis {
  currentAvg: number;
  firstAvg: number;
  /** Variação do índice de mesmos produtos desde a primeira semana. */
  accumulatedPct: number;
  /** Variação do índice na última semana; null sem semana anterior ou sem produto repetido. */
  weeklyPct: number | null;
  /** Produtos da última semana comparados com o próprio preço anterior. */
  comparedProducts: number;
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

/** Variação (%) abaixo da qual o preço é tratado como estável, nos cards e na prévia do link. */
export const STABLE_PCT = 0.05;

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

/**
 * Mesmo produto no mesmo lugar: mercado, cidade/UF, marca e resfriado/congelado.
 * Caixa e espaços não importam ("Lizeu" = " lizeu ").
 */
export const productKey = (price: ChickenPrice) =>
  [price.market_name, price.city, price.state, price.brand, price.state_type]
    .map((part) => part.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR"))
    .join("|");

const geometricMean = (values: number[]) => Math.exp(mean(values.map(Math.log)));

/** Preço de cada produto em cada semana (média, se foi coletado mais de uma vez), em ordem cronológica. */
function weeklyProductPrices(prices: ChickenPrice[]) {
  const weeks = new Map<string, Map<string, number[]>>();
  for (const price of prices) {
    const week = weekStart(price.recorded_at);
    const products = weeks.get(week) ?? new Map<string, number[]>();
    const key = productKey(price);
    products.set(key, [...(products.get(key) ?? []), price.price_per_kg]);
    weeks.set(week, products);
  }
  return [...weeks.entries()]
    .sort(([firstWeek], [secondWeek]) => firstWeek.localeCompare(secondWeek))
    .map(([week, products]) => ({ week, products: [...products].map(([key, values]) => ({ key, price: mean(values) })) }));
}

/**
 * Índice encadeado de mesmos produtos (como o IPCA): cada produto é comparado com o
 * próprio último preço, e a variação da semana é a média geométrica dessas variações.
 * Assim o índice não sobe só porque a semana coletou um mercado mais caro, nem cai
 * porque um mercado barato entrou. Produto novo só passa a contar na volta seguinte.
 */
export function sameProductIndex(prices: ChickenPrice[]): IndexPoint[] {
  const lastPrice = new Map<string, number>();
  let index = 100;
  return weeklyProductPrices(prices).map(({ week, products }) => {
    const ratios = products.filter(({ key }) => lastPrice.has(key)).map(({ key, price }) => price / (lastPrice.get(key) ?? price));
    if (ratios.length > 0) index *= geometricMean(ratios);
    for (const { key, price } of products) lastPrice.set(key, price);
    return { week, index, compared: ratios.length };
  });
}

function kgComparison(wage: number, startPrice: number, nowPrice: number) {
  const start = wage / startPrice;
  const now = wage / nowPrice;
  return { start, now, deltaPct: ((now - start) / start) * 100 };
}

/** Preços que entram no índice: só o preço normal de gôndola (ofertas e clube ficam de fora). */
export const isIndexPrice = (price: ChickenPrice) => price.price_kind === "regular";

/** Variação semanal do índice; sem produto repetido não há como medir (null, não 0%). */
function weeklyChange(current: IndexPoint, previous: IndexPoint | undefined) {
  if (!previous || current.compared === 0) return null;
  return (current.index / previous.index - 1) * 100;
}

/**
 * KPIs do índice. Preço médio e gráfico mostram a média do que foi coletado; as
 * variações e o poder de compra seguem o índice de mesmos produtos. Tudo só com
 * preços normais; as contagens de registros e fotos auditadas consideram o recorte todo.
 */
export function computeKpis(prices: ChickenPrice[], settings: EconomicSettings): Kpis | null {
  const indexPrices = prices.filter(isIndexPrice);
  const series = weeklySeries(indexPrices);
  if (series.length === 0) return null;

  const first = series[0];
  const current = series[series.length - 1];
  const index = sameProductIndex(indexPrices);
  const currentIndex = index[index.length - 1];
  // Preço da cesta da 1ª semana corrigido pelo índice: base do poder de compra hoje.
  const comparablePrice = first.average * (currentIndex.index / 100);

  return {
    currentAvg: current.average,
    firstAvg: first.average,
    accumulatedPct: currentIndex.index - 100,
    weeklyPct: weeklyChange(currentIndex, index[index.length - 2]),
    comparedProducts: currentIndex.compared,
    firstWeek: first.week,
    currentWeek: current.week,
    weeks: series.length,
    records: prices.length,
    audited: prices.filter((price) => price.has_valid_exif).length,
    promoCount: prices.length - indexPrices.length,
    minWageKg: kgComparison(settings.min_wage, first.average, comparablePrice),
    avgWageKg: kgComparison(settings.avg_wage, first.average, comparablePrice),
  };
}
