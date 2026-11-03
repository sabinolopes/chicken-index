"use client";

import { useMemo, useState } from "react";
import { Drumstick, Share2 } from "lucide-react";
import type { DashboardData } from "@/lib/types";
import { computeKpis, isIndexPrice, weeklySeries } from "@/lib/stats";
import { formatDate, formatDateTime } from "@/lib/format";
import { EMPTY_FILTERS, Filters, type FilterState } from "./filters";
import { KpiCards } from "./kpi-cards";
import { WageThermometer } from "./wage-thermometer";
import { PriceChart } from "./price-chart";
import { Gallery } from "./gallery";
import { ShareCardDialog } from "./share-card";

/** Por que não há indicadores: banco vazio, recorte só com promoções ou filtro sem resultado. */
function emptyMessage(totalCount: number, filteredCount: number) {
  if (totalCount === 0) return "Ainda não há preços cadastrados. O primeiro registro aparece aqui assim que for publicado.";
  if (filteredCount > 0) return "Neste recorte só há preços promocionais (oferta ou clube), que ficam fora do índice. Veja as fotos abaixo.";
  return "Nenhum registro encontrado para os filtros selecionados.";
}

export function Dashboard({ data }: { data: DashboardData }) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [shareOpen, setShareOpen] = useState(false);

  const filtered = useMemo(
    () =>
      data.prices.filter(
        (price) =>
          (!filters.state || price.state === filters.state) &&
          (!filters.city || price.city === filters.city) &&
          (!filters.market || price.market_name === filters.market) &&
          (!filters.brand || price.brand === filters.brand),
      ),
    [data.prices, filters],
  );

  const series = useMemo(() => weeklySeries(filtered.filter(isIndexPrice)), [filtered]);
  const promoSeries = useMemo(() => weeklySeries(filtered.filter((price) => !isIndexPrice(price))), [filtered]);
  const kpis = useMemo(() => computeKpis(filtered, data.settings), [filtered, data.settings]);
  const filterKey = `${filters.state}|${filters.city}|${filters.market}|${filters.brand}`;
  const filterLabel = [filters.brand, filters.market, filters.city || filters.state].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-accent text-sm font-semibold uppercase tracking-wide">
              <Drumstick className="size-4" aria-hidden />
              Monitor de inflação
            </div>
            <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight">Frangômetro</h1>
            <p className="mt-2 max-w-2xl text-muted">
              Preço do quilo do peito de frango coletado semanalmente em supermercados, com foto da etiqueta auditada
              por metadados EXIF e hash SHA-256.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            disabled={!kpis}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-40 shrink-0"
          >
            <Share2 className="size-4" aria-hidden />
            Gerar Resumo para Redes
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 flex flex-col gap-6">
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

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-subtle flex flex-col gap-1 sm:flex-row sm:justify-between">
          <span>
            {kpis
              ? `Período: ${formatDate(kpis.firstWeek)} a ${formatDate(data.prices[0]?.recorded_at ?? kpis.currentWeek)}`
              : "Sem dados"}
          </span>
          <span>Atualizado em {formatDateTime(data.generatedAt)}</span>
        </div>
      </footer>

      {shareOpen && kpis && (
        <ShareCardDialog kpis={kpis} settings={data.settings} filterLabel={filterLabel} onClose={() => setShareOpen(false)} />
      )}
    </div>
  );
}
