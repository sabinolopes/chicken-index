"use client";

import { useMemo, useState } from "react";
import { Drumstick, FlaskConical, Share2 } from "lucide-react";
import type { DashboardData } from "@/lib/types";
import { computeKpis, weeklySeries } from "@/lib/stats";
import { formatDate, formatDateTime } from "@/lib/format";
import { EMPTY_FILTERS, Filters, type FilterState } from "./filters";
import { KpiCards } from "./kpi-cards";
import { WageThermometer } from "./wage-thermometer";
import { PriceChart } from "./price-chart";
import { Gallery } from "./gallery";
import { ShareCardDialog } from "./share-card";

export function Dashboard({ data }: { data: DashboardData }) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [shareOpen, setShareOpen] = useState(false);

  const filtered = useMemo(
    () =>
      data.prices.filter(
        (p) =>
          (!filters.state || p.state === filters.state) &&
          (!filters.city || p.city === filters.city) &&
          (!filters.market || p.market_name === filters.market) &&
          (!filters.brand || p.brand === filters.brand),
      ),
    [data.prices, filters],
  );

  const series = useMemo(() => weeklySeries(filtered), [filtered]);
  const kpis = useMemo(() => computeKpis(filtered, data.settings), [filtered, data.settings]);
  const filterKey = `${filters.state}|${filters.city}|${filters.market}|${filters.brand}`;
  const filterLabel = [filters.brand, filters.market, filters.city || filters.state].filter(Boolean).join(" · ");

  return (
    <div className="flex-1">
      {data.mode === "demo" && (
        <div className="bg-amber-100 text-amber-950 border-b border-amber-200">
          <div className="mx-auto max-w-6xl px-4 py-2 text-sm flex items-center gap-2">
            <FlaskConical className="size-4 shrink-0" aria-hidden />
            <span>
              <strong>Modo Demo:</strong> dados fictícios de 8 semanas. Preencha{" "}
              <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> no{" "}
              <code className="font-mono text-xs">.env.local</code> para usar dados reais.
            </span>
          </div>
        </div>
      )}

      <header className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-accent text-sm font-semibold uppercase tracking-wide">
              <Drumstick className="size-4" aria-hidden />
              Monitor de inflação
            </div>
            <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight">Índice do Peito de Frango</h1>
            <p className="mt-2 max-w-2xl text-muted">
              Preço do quilo coletado semanalmente em supermercados, com foto da etiqueta auditada por metadados EXIF e
              hash SHA-256.
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

      <main className="mx-auto max-w-6xl px-4 py-6 flex flex-col gap-6">
        <Filters prices={data.prices} value={filters} onChange={setFilters} resultCount={filtered.length} />

        {kpis ? (
          <>
            <KpiCards kpis={kpis} />
            <WageThermometer kpis={kpis} settings={data.settings} />
            <PriceChart series={series} />
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-muted">
            Nenhum registro encontrado para os filtros selecionados.
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
