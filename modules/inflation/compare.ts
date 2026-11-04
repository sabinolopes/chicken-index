import type { IndexPoint } from "@/modules/dashboard/stats";
import type { IpcaValues, OfficialInflation } from "./types";

/** Variação no mesmo período: Frangômetro (índice de mesmos produtos) e as séries do IPCA. */
export interface PeriodComparison extends IpcaValues {
  kind: "period";
  from: string; // YYYY-MM
  to: string; // YYYY-MM
  frangometro: number;
}

/** Ainda sem mês do IPCA publicado desde o início da coleta: mostra os 12 meses como referência. */
export interface ReferenceComparison extends IpcaValues {
  kind: "reference";
  /** Primeiro mês do Frangômetro, que o IBGE ainda não publicou. */
  awaiting: string;
  /** Último mês publicado (o acumulado em 12 meses termina nele). */
  month: string;
}

export type InflationComparison = PeriodComparison | ReferenceComparison;

const monthOf = (isoDate: string) => isoDate.slice(0, 7);
const accumulate = (monthly: number[]) => (monthly.reduce((total, pct) => total * (1 + pct / 100), 1) - 1) * 100;

/**
 * Compara a variação do Frangômetro com o IPCA nos meses em comum, do mês da 1ª coleta até o
 * último mês publicado. O índice do Frangômetro é lido na última semana que começa até esse mês.
 */
export function compareWithIpca(inflation: OfficialInflation, index: IndexPoint[]): InflationComparison | null {
  const first = index[0];
  if (!first) return null;
  const from = monthOf(first.week);
  const months = inflation.months.filter((month) => month.month >= from);
  const to = months.at(-1)?.month;
  if (!to) {
    const { month, general, food, chicken } = inflation.twelveMonths;
    return { kind: "reference", awaiting: from, month, general, food, chicken };
  }

  const lastPoint = index.filter((point) => monthOf(point.week) <= to).at(-1) ?? first;
  return {
    kind: "period",
    from,
    to,
    frangometro: lastPoint.index - 100,
    general: accumulate(months.map((month) => month.general)),
    food: accumulate(months.map((month) => month.food)),
    chicken: accumulate(months.map((month) => month.chicken)),
  };
}

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "2026-09" → "set/2026" */
export function formatMonth(month: string) {
  const [year, number] = month.split("-");
  return `${MONTHS[Number(number) - 1]}/${year}`;
}
