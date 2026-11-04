import Link from "next/link";
import { Landmark } from "lucide-react";
import { Panel, PanelHeader } from "@/components/elements/panel";
import { formatPct } from "@/lib/format";
import type { InflationComparison as Comparison } from "@/modules/inflation/compare";
import { comparisonPeriod, comparisonRows } from "./comparison-rows";

/** Frangômetro lado a lado com o IPCA do IBGE. `comparison` null = IBGE indisponível agora. */
export function InflationComparison({ comparison }: { comparison: Comparison | null }) {
  return (
    <Panel labelledBy="ipca-title" padding="roomy">
      <PanelHeader
        id="ipca-title"
        size="lg"
        icon={<Landmark className="size-5 text-accent" aria-hidden />}
        title="Frangômetro vs. inflação oficial"
        description={comparison ? comparisonPeriod(comparison) : "Não foi possível consultar o IPCA no IBGE agora. Tente mais tarde."}
      />

      {comparison && (
        <dl className="mt-4 divide-y divide-border">
          {comparisonRows(comparison).map(({ label, pct, own }) => (
            <div key={label} className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className={own ? "font-semibold" : "text-muted"}>{label}</dt>
              <dd className={`tabular ${own ? "text-lg font-bold" : "font-medium"}`}>{formatPct(pct)}</dd>
            </div>
          ))}
        </dl>
      )}

      <p className="mt-3 text-xs text-subtle">
        Fonte: IBGE, IPCA (tabela 7060 do SIDRA).{" "}
        <Link href="/como-medimos" className="underline underline-offset-2 hover:text-foreground">
          Como comparamos
        </Link>
      </p>
    </Panel>
  );
}
