"use client";

import { useMemo, useState } from "react";
import { LineChart as LineIcon, Table2 } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChoiceGroup } from "@/components/elements/choice-group";
import { Panel, PanelHeader } from "@/components/elements/panel";
import type { WeeklyPoint } from "@/modules/dashboard/stats";
import { AVG_KEY, BRAND_COLORS, brandLabel, brandsInSeries, chartRows, priceAxis, PROMO_KEY } from "./chart-data";
import { ChartLegend } from "./chart-legend";
import { ChartTooltip } from "./chart-tooltip";
import { PriceTable } from "./price-table";

type View = "chart" | "table";

const VIEW_LABELS: Record<View, React.ReactNode> = {
  chart: (
    <>
      <LineIcon className="size-4" aria-hidden /> Gráfico
    </>
  ),
  table: (
    <>
      <Table2 className="size-4" aria-hidden /> Tabela
    </>
  ),
};

const AXIS_TICK = { fill: "var(--subtle)", fontSize: 12 };

export function PriceChart({ series, promoSeries }: { series: WeeklyPoint[]; promoSeries: WeeklyPoint[] }) {
  const [view, setView] = useState<View>("chart");
  const brands = useMemo(() => brandsInSeries(series), [series]);
  const rows = useMemo(() => chartRows(series, promoSeries), [series, promoSeries]);
  const yAxis = useMemo(() => priceAxis(rows), [rows]);
  const hasPromo = promoSeries.length > 0;

  return (
    <Panel labelledBy="chart-title" padding="roomy">
      <PanelHeader
        id="chart-title"
        size="lg"
        title="Evolução semanal do preço por kg"
        description={
          <>
            Média semanal do preço normal de gôndola, geral e por marca.
            {hasPromo && " Ofertas e preços de clube ficam fora do índice, na linha tracejada."}
          </>
        }
        aside={<ChoiceGroup label="Visualização" variant="segmented" options={["chart", "table"] as const} labels={VIEW_LABELS} value={view} onChange={setView} />}
      />

      <ChartLegend brands={brands} hasPromo={hasPromo} />

      {view === "table" ? (
        <PriceTable rows={rows} series={series} promoSeries={promoSeries} brands={brands} />
      ) : (
        <div className="-ml-2 mt-3 h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
              <YAxis
                domain={yAxis.domain}
                ticks={yAxis.ticks}
                interval={0}
                tickFormatter={(value: number) => `R$ ${value}`}
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                width={56}
              />
              <Tooltip content={(props) => <ChartTooltip {...props} />} cursor={{ stroke: "var(--subtle)", strokeDasharray: "3 3" }} />
              {brands.map((brand) => (
                <Line
                  key={brand}
                  type="monotone"
                  dataKey={brand}
                  name={brandLabel(brand)}
                  stroke={BRAND_COLORS[brand]}
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
      )}
    </Panel>
  );
}
