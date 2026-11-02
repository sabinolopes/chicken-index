"use client";

import { useMemo, useState } from "react";
import { LineChart as LineIcon, Table2 } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { WeeklyPoint } from "@/lib/stats";
import { BRANDS } from "@/lib/types";
import { formatBRL, formatShortDate } from "@/lib/format";

// Cor segue a marca (nunca a posição), para não repintar ao filtrar.
export const BRAND_COLORS: Record<string, string> = {
  Sadia: "var(--series-1)",
  Seara: "var(--series-2)",
  Perdigão: "var(--series-3)",
  Outra: "var(--series-4)",
};

const AVG_KEY = "Média geral";
const PROMO_KEY = "Promoções (média)";

export function PriceChart({ series, promoSeries }: { series: WeeklyPoint[]; promoSeries: WeeklyPoint[] }) {
  const [view, setView] = useState<"chart" | "table">("chart");

  const brands = useMemo(
    () => BRANDS.filter((b) => series.some((p) => p.byBrand[b] !== undefined)),
    [series],
  );

  const hasPromo = promoSeries.length > 0;
  const promoByWeek = useMemo(() => new Map(promoSeries.map((p) => [p.week, p])), [promoSeries]);

  // Semanas com só promoção também viram linha (sem média geral nelas).
  const rows = useMemo(() => {
    const weeks = [...new Set([...series.map((p) => p.week), ...promoSeries.map((p) => p.week)])].sort();
    const byWeek = new Map(series.map((p) => [p.week, p]));
    return weeks.map((week) => {
      const regular = byWeek.get(week);
      return {
        week,
        label: formatShortDate(week),
        [AVG_KEY]: regular?.average,
        [PROMO_KEY]: promoByWeek.get(week)?.average,
        ...regular?.byBrand,
      };
    });
  }, [series, promoSeries, promoByWeek]);

  // Eixo Y com passo inteiro e uniforme (o automático do Recharts pula valores).
  const yAxis = useMemo(() => {
    const values = rows.flatMap((r) => Object.values(r).filter((v): v is number => typeof v === "number"));
    if (values.length === 0) return { domain: [0, 1] as [number, number], ticks: [0, 1] };
    const step = Math.max(...values) - Math.min(...values) > 6 ? 2 : 1;
    const lo = Math.floor((Math.min(...values) - 0.5) / step) * step;
    const hi = Math.ceil((Math.max(...values) + 0.5) / step) * step;
    const ticks: number[] = [];
    for (let t = lo; t <= hi; t += step) ticks.push(t);
    return { domain: [lo, hi] as [number, number], ticks };
  }, [rows]);

  return (
    <section aria-labelledby="chart-title" className="rounded-xl border border-border bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="chart-title" className="text-lg font-semibold">
            Evolução semanal do preço por kg
          </h2>
          <p className="mt-1 text-sm text-muted">
            Média semanal do preço normal de gôndola, geral e por marca.
            {hasPromo && " Ofertas e preços de clube ficam fora do índice, na linha tracejada."}
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-border p-0.5 text-sm" role="group" aria-label="Visualização">
          <ToggleButton active={view === "chart"} onClick={() => setView("chart")}>
            <LineIcon className="size-4" aria-hidden /> Gráfico
          </ToggleButton>
          <ToggleButton active={view === "table"} onClick={() => setView("table")}>
            <Table2 className="size-4" aria-hidden /> Tabela
          </ToggleButton>
        </div>
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted" aria-label="Legenda">
        <LegendItem color="var(--series-avg)" label={AVG_KEY} thick />
        {brands.map((b) => (
          <LegendItem key={b} color={BRAND_COLORS[b]} label={b} />
        ))}
        {hasPromo && <LegendItem color="var(--series-promo)" label={PROMO_KEY} dashed />}
      </ul>

      {view === "chart" ? (
        <div className="mt-3 h-72 sm:h-80 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--subtle)", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
              />
              <YAxis
                domain={yAxis.domain}
                ticks={yAxis.ticks}
                interval={0}
                tickFormatter={(v: number) => `R$ ${v}`}
                tick={{ fill: "var(--subtle)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={56}
              />
              <Tooltip content={(props) => <ChartTooltip {...props} />} cursor={{ stroke: "var(--subtle)", strokeDasharray: "3 3" }} />
              {brands.map((b) => (
                <Line
                  key={b}
                  type="monotone"
                  dataKey={b}
                  stroke={BRAND_COLORS[b]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
                  connectNulls
                />
              ))}
              {hasPromo && (
                <Line
                  type="monotone"
                  dataKey={PROMO_KEY}
                  stroke="var(--series-promo)"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={{ r: 3, fill: "var(--series-promo)", stroke: "var(--surface)", strokeWidth: 1.5 }}
                  activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2 }}
                  connectNulls
                />
              )}
              <Line
                type="monotone"
                dataKey={AVG_KEY}
                stroke="var(--series-avg)"
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--series-avg)", stroke: "var(--surface)", strokeWidth: 2 }}
                activeDot={{ r: 6, stroke: "var(--surface)", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm tabular">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-2 pr-4 font-medium">Semana</th>
                <th className="py-2 pr-4 font-medium text-right">{AVG_KEY}</th>
                {brands.map((b) => (
                  <th key={b} className="py-2 pr-4 font-medium text-right">
                    {b}
                  </th>
                ))}
                {hasPromo && <th className="py-2 pr-4 font-medium text-right">Promoções</th>}
                <th className="py-2 font-medium text-right">Etiquetas</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const regular = series.find((p) => p.week === row.week);
                const promo = promoByWeek.get(row.week);
                return (
                  <tr key={row.week} className="border-b border-border/60">
                    <td className="py-2 pr-4">{row.label}</td>
                    <td className="py-2 pr-4 text-right font-semibold">{regular ? formatBRL(regular.average) : "—"}</td>
                    {brands.map((b) => (
                      <td key={b} className="py-2 pr-4 text-right">
                        {regular?.byBrand[b] !== undefined ? formatBRL(regular.byBrand[b]) : "—"}
                      </td>
                    ))}
                    {hasPromo && (
                      <td className="py-2 pr-4 text-right">{promo ? `${formatBRL(promo.average)} (${promo.count})` : "—"}</td>
                    )}
                    <td className="py-2 text-right text-muted">{(regular?.count ?? 0) + (promo?.count ?? 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const sorted = [...payload].sort((a, b) => (a.dataKey === AVG_KEY ? -1 : b.dataKey === AVG_KEY ? 1 : 0));
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm shadow-lg">
      <p className="mb-1 font-medium">Semana de {label}</p>
      <ul className="space-y-0.5">
        {sorted.filter((item) => item.value !== undefined && item.value !== null).map((item) => (
          <li key={String(item.dataKey)} className="flex items-center gap-2">
            <span className="inline-block size-2.5 rounded-full" style={{ background: item.color }} aria-hidden />
            <span className="text-muted">{item.name}</span>
            <span className={`ml-auto pl-4 tabular ${item.dataKey === AVG_KEY ? "font-semibold" : ""}`}>
              {formatBRL(Number(item.value))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LegendItem({ color, label, thick = false, dashed = false }: { color: string; label: string; thick?: boolean; dashed?: boolean }) {
  return (
    <li className="flex items-center gap-1.5">
      <span
        className={`inline-block w-4 ${thick ? "h-[3px]" : "h-0.5"} ${dashed ? "" : "rounded-full"}`}
        style={dashed ? { backgroundImage: `linear-gradient(to right, ${color} 60%, transparent 60%)`, backgroundSize: "6px 100%" } : { background: color }}
        aria-hidden
      />
      <span className={thick ? "font-medium text-foreground" : ""}>{label}</span>
    </li>
  );
}

function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 ${
        active ? "bg-foreground text-white" : "text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
