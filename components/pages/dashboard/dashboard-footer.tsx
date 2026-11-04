import Link from "next/link";
import { formatDate, formatDateTime } from "@/lib/format";

interface DashboardFooterProps {
  /** Primeira e última semana do recorte; null quando não há indicadores. */
  period: { from: string; to: string } | null;
  generatedAt: string;
}

export function DashboardFooter({ period, generatedAt }: DashboardFooterProps) {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-sm text-subtle sm:flex-row sm:justify-between">
        <span>{period ? `Período: ${formatDate(period.from)} a ${formatDate(period.to)}` : "Sem dados"}</span>
        <span>
          Atualizado em {formatDateTime(generatedAt)} ·{" "}
          <Link href="/como-medimos" className="underline underline-offset-2 hover:text-foreground">
            Como medimos
          </Link>
        </span>
      </div>
    </footer>
  );
}
