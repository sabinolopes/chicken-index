import { Thermometer, TrendingDown, TrendingUp } from "lucide-react";
import type { Kpis } from "@/modules/dashboard/stats";
import type { EconomicSettings } from "@/modules/settings/types";
import { Panel, PanelHeader } from "@/components/elements/panel";
import { formatBRL, formatKg, formatPct, formatShortDate } from "@/lib/format";

export function WageThermometer({ kpis, settings }: { kpis: Kpis; settings: EconomicSettings }) {
  const rows = [
    { label: "Salário mínimo", wage: settings.min_wage, kg: kpis.minWageKg },
    { label: "Salário médio", wage: settings.avg_wage, kg: kpis.avgWageKg },
  ];

  return (
    <Panel labelledBy="thermo-title" padding="roomy">
      <PanelHeader
        id="thermo-title"
        size="lg"
        icon={<Thermometer className="size-5 text-accent" aria-hidden />}
        title="Termômetro Salarial"
        description={<>Quantos quilos de peito de frango um salário compra — {formatShortDate(kpis.firstWeek)} vs. hoje.</>}
      />

      <div className="mt-5 grid gap-6 md:grid-cols-2">
        {rows.map(({ label, wage, kg }) => {
          const lost = kg.start - kg.now;
          const max = Math.max(kg.start, kg.now);
          const worse = kg.deltaPct < 0;
          return (
            <div key={label}>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-medium">{label}</h3>
                <span className="text-sm text-subtle tabular">{formatBRL(wage)}</span>
              </div>

              <dl className="mt-3 space-y-2.5">
                <Bar label="No início" value={kg.start} max={max} color="bg-stone-300" />
                <Bar label="Hoje" value={kg.now} max={max} color="bg-foreground" />
              </dl>

              <p className="mt-3 flex items-center gap-1.5 text-sm">
                {worse ? (
                  <TrendingDown className="size-4 text-red-700" aria-hidden />
                ) : (
                  <TrendingUp className="size-4 text-emerald-700" aria-hidden />
                )}
                <span>
                  {worse ? "Perdeu" : "Ganhou"} <strong className="tabular">{formatKg(Math.abs(lost))}</strong> de poder de
                  compra ({formatPct(kg.deltaPct)})
                </span>
              </p>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3">
      <dt className="text-sm text-muted">{label}</dt>
      <div className="h-3 rounded-full bg-stone-100" aria-hidden>
        <div className={`h-3 rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <dd className="text-sm font-semibold tabular w-16 text-right">{formatKg(value)}</dd>
    </div>
  );
}
