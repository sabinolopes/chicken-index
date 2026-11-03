import type { TooltipContentProps } from "recharts";
import { formatBRL } from "@/lib/format";
import { AVG_KEY } from "./chart-data";

export function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  // A média vem primeiro; as marcas mantêm a ordem do gráfico.
  const sorted = [...payload].sort((first, second) => Number(second.dataKey === AVG_KEY) - Number(first.dataKey === AVG_KEY));
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm shadow-lg">
      <p className="mb-1 font-medium">Semana de {label}</p>
      <ul className="space-y-0.5">
        {sorted
          .filter((item) => item.value !== undefined && item.value !== null)
          .map((item) => (
            <li key={String(item.dataKey)} className="flex items-center gap-2">
              <span className="inline-block size-2.5 rounded-full" style={{ background: item.color }} aria-hidden />
              <span className="text-muted">{item.name}</span>
              <span className={`ml-auto pl-4 tabular ${item.dataKey === AVG_KEY ? "font-semibold" : ""}`}>{formatBRL(Number(item.value))}</span>
            </li>
          ))}
      </ul>
    </div>
  );
}
