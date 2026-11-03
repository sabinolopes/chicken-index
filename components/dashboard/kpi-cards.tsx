import { BadgeCheck, CalendarDays, Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { Kpis } from "@/modules/dashboard/stats";
import { formatBRL, formatPct, formatShortDate } from "@/lib/format";

// Abaixo de 0,05% a variação é tratada como estável.
const STABLE_THRESHOLD = 0.05;

const TRENDS = {
  up: { Icon: TrendingUp, tone: "text-red-700 bg-red-50", label: "alta" },
  down: { Icon: TrendingDown, tone: "text-emerald-700 bg-emerald-50", label: "queda" },
  stable: { Icon: Minus, tone: "text-muted bg-stone-100", label: "estável" },
} as const;

function trendOf(pct: number) {
  if (pct > STABLE_THRESHOLD) return TRENDS.up;
  if (pct < -STABLE_THRESHOLD) return TRENDS.down;
  return TRENDS.stable;
}

function Trend({ pct, label }: { pct: number; label: string }) {
  const { Icon, tone } = trendOf(pct);
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${tone}`}>
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}

export function KpiCards({ kpis }: { kpis: Kpis }) {
  return (
    <section aria-label="Indicadores" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile label="Preço médio atual (kg)">
        <p className="text-3xl sm:text-4xl font-bold tracking-tight tabular">{formatBRL(kpis.currentAvg)}</p>
        <p className="mt-2 flex items-center gap-1 text-xs text-subtle">
          <CalendarDays className="size-3.5" aria-hidden />
          Semana de {formatShortDate(kpis.currentWeek)}
        </p>
      </Tile>

      <Tile label="Variação acumulada">
        <p className="text-3xl sm:text-4xl font-bold tracking-tight tabular">{formatPct(kpis.accumulatedPct)}</p>
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-subtle">
          <Trend pct={kpis.accumulatedPct} label={trendOf(kpis.accumulatedPct).label} />
          desde {formatShortDate(kpis.firstWeek)} ({formatBRL(kpis.firstAvg)})
        </p>
      </Tile>

      <Tile label="Última semana">
        <p className="text-3xl sm:text-4xl font-bold tracking-tight tabular">
          {kpis.weeklyPct === null ? "—" : formatPct(kpis.weeklyPct)}
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-subtle">
          {kpis.previousAvg !== null && kpis.weeklyPct !== null ? (
            <>
              <Trend pct={kpis.weeklyPct} label="vs. semana anterior" />
              {formatBRL(kpis.previousAvg)}
            </>
          ) : (
            "Apenas uma semana de dados"
          )}
        </p>
      </Tile>

      <Tile label="Fotos auditadas">
        <p className="text-3xl sm:text-4xl font-bold tracking-tight tabular">
          {kpis.audited}
          <span className="text-lg font-medium text-subtle">/{kpis.records}</span>
        </p>
        <p className="mt-2 flex items-center gap-1 text-xs text-subtle">
          <BadgeCheck className="size-3.5 text-emerald-700" aria-hidden />
          com EXIF original · {kpis.weeks} semanas
        </p>
      </Tile>
    </section>
  );
}

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <h2 className="text-sm font-medium text-muted">{label}</h2>
      <div className="mt-2">{children}</div>
    </div>
  );
}
