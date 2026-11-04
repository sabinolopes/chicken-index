import { formatMonth, type InflationComparison } from "@/modules/inflation/compare";

export interface ComparisonRow {
  label: string;
  pct: number;
  /** A linha do próprio Frangômetro, em destaque. */
  own: boolean;
}

/** Linhas do painel: o Frangômetro (só quando há meses em comum) e as três séries do IPCA. */
export function comparisonRows(comparison: InflationComparison): ComparisonRow[] {
  const ipca = [
    { label: "IPCA · Frango em pedaços", pct: comparison.chicken, own: false },
    { label: "IPCA · Alimentação e bebidas", pct: comparison.food, own: false },
    { label: "IPCA · Índice geral", pct: comparison.general, own: false },
  ];
  if (comparison.kind === "reference") return ipca;
  return [{ label: "Frangômetro · peito de frango", pct: comparison.frangometro, own: true }, ...ipca];
}

/** Frase que diz qual período está sendo comparado (ou por que ainda não há comparação). */
export function comparisonPeriod(comparison: InflationComparison) {
  if (comparison.kind === "period") {
    const range = comparison.from === comparison.to ? formatMonth(comparison.to) : `${formatMonth(comparison.from)} a ${formatMonth(comparison.to)}`;
    return `Variação acumulada em ${range}, últimos dados publicados pelo IBGE.`;
  }
  return `O IPCA de ${formatMonth(comparison.awaiting)}, primeiro mês do Frangômetro, ainda não foi publicado (sai por volta do dia 10 do mês seguinte). Por enquanto, a referência é o IPCA acumulado em 12 meses até ${formatMonth(comparison.month)}.`;
}
