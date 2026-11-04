"use client";

import { useMemo, useState } from "react";
import { applyFilters, EMPTY_FILTERS, filterLabel, type FilterState } from "@/components/blocks/filters";
import { computeKpis, isIndexPrice, sameProductIndex, weeklySeries } from "@/modules/dashboard/stats";
import type { DashboardData } from "@/modules/dashboard/types";
import { compareWithIpca } from "@/modules/inflation/compare";
import type { OfficialInflation } from "@/modules/inflation/types";

/** Estado dos filtros e tudo o que deriva do recorte: séries do gráfico, indicadores e comparação com o IPCA. */
export function useDashboard(data: DashboardData, inflation: OfficialInflation | null) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const filtered = useMemo(() => applyFilters(data.prices, filters), [data.prices, filters]);
  const series = useMemo(() => weeklySeries(filtered.filter(isIndexPrice)), [filtered]);
  const promoSeries = useMemo(() => weeklySeries(filtered.filter((price) => !isIndexPrice(price))), [filtered]);
  const kpis = useMemo(() => computeKpis(filtered, data.settings), [filtered, data.settings]);
  const ipcaComparison = useMemo(
    () => (inflation ? compareWithIpca(inflation, sameProductIndex(filtered.filter(isIndexPrice))) : null),
    [inflation, filtered],
  );

  return {
    filters,
    setFilters,
    filtered,
    series,
    promoSeries,
    kpis,
    ipcaComparison,
    filterLabel: filterLabel(filters),
    /** Muda a cada recorte: a galeria volta para a primeira página quando o filtro muda. */
    filterKey: Object.values(filters).join("|"),
  };
}
