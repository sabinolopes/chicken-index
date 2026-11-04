import type { Kpis } from "@/modules/dashboard/stats";

const productsLabel = (count: number) => (count === 1 ? "1 produto comparado" : `${count} produtos comparados`);

/** Explica a variação da última semana: quantos produtos repetidos sustentam o número, ou por que não há número. */
export function weeklyNote(kpis: Pick<Kpis, "weeks" | "comparedProducts">) {
  if (kpis.weeks < 2) return "Apenas uma semana de dados";
  if (kpis.comparedProducts === 0) return "Nenhum produto repetido da semana anterior";
  return productsLabel(kpis.comparedProducts);
}
