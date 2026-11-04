import { formatBRL, formatKg, formatPct, formatShortDate } from "@/lib/format";
import type { ShareSummary } from "./draw-card";

/** Resumo em texto para colar no WhatsApp (negrito com *asteriscos*), com o link para conferir as fotos. */
export function shareText({ kpis, filterLabel, site }: Omit<ShareSummary, "settings">) {
  return [
    `🐔 *Frangômetro*: preço do peito de frango${filterLabel ? ` — ${filterLabel}` : ""}`,
    `Preço médio do kg (sem promoções): *${formatBRL(kpis.currentAvg)}* (${formatPct(kpis.accumulatedPct)} desde ${formatShortDate(kpis.firstWeek)} nos mesmos mercados)`,
    `Salário mínimo comprava ${formatKg(kpis.minWageKg.start)}, hoje compra ${formatKg(kpis.minWageKg.now)}.`,
    `Salário médio comprava ${formatKg(kpis.avgWageKg.start)}, hoje compra ${formatKg(kpis.avgWageKg.now)}.`,
    "Fotos auditadas com EXIF + SHA-256.",
    ...(site ? [`Veja as fotos das etiquetas: https://${site}`] : []),
  ].join("\n");
}
