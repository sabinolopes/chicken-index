"use client";

import { useState } from "react";
import { Filters } from "@/components/blocks/filters";
import { Gallery } from "@/components/blocks/gallery";
import { KpiCards } from "@/components/blocks/kpi-cards";
import { PriceChart } from "@/components/blocks/price-chart";
import { ShareCardDialog } from "@/components/blocks/share-card";
import { WageThermometer } from "@/components/blocks/wage-thermometer";
import type { DashboardData } from "@/modules/dashboard/types";
import { DashboardFooter } from "./dashboard-footer";
import { DashboardHeader } from "./dashboard-header";
import { emptyMessage } from "./empty-message";
import { useDashboard } from "./use-dashboard";

/** Página pública: filtros no topo; indicadores, gráfico e galeria seguem o recorte escolhido. */
export function Dashboard({ data }: { data: DashboardData }) {
  const { filters, setFilters, filtered, series, promoSeries, kpis, filterLabel, filterKey } = useDashboard(data);
  const [shareOpen, setShareOpen] = useState(false);
  const period = kpis ? { from: kpis.firstWeek, to: data.prices[0]?.recorded_at ?? kpis.currentWeek } : null;

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader onShare={() => setShareOpen(true)} canShare={kpis !== null} />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
        <Filters prices={data.prices} value={filters} onChange={setFilters} resultCount={filtered.length} />

        {kpis ? (
          <>
            <KpiCards kpis={kpis} />
            <WageThermometer kpis={kpis} settings={data.settings} />
            <PriceChart series={series} promoSeries={promoSeries} />
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-muted">
            {emptyMessage(data.prices.length, filtered.length)}
          </div>
        )}

        <Gallery key={filterKey} prices={filtered} />
      </main>

      <DashboardFooter period={period} generatedAt={data.generatedAt} />

      {shareOpen && kpis && (
        <ShareCardDialog kpis={kpis} settings={data.settings} filterLabel={filterLabel} onClose={() => setShareOpen(false)} />
      )}
    </div>
  );
}
