import { formatBRL, formatKg, formatPct, formatShortDate } from "@/lib/format";
import { STABLE_PCT, type Kpis } from "./stats";

export type PreviewTone = "up" | "down" | "stable";

/** Textos da imagem que aparece quando o link do site é colado no WhatsApp e nas redes. */
export interface LinkPreview {
  price: string;
  week: string;
  /** Variação acumulada; null com uma semana só (ainda não há o que comparar). */
  change: { text: string; tone: PreviewTone } | null;
  wage: string;
}

function toneOf(pct: number): PreviewTone {
  if (pct > STABLE_PCT) return "up";
  if (pct < -STABLE_PCT) return "down";
  return "stable";
}

/** null sem preços normais: a imagem mostra só o nome e a proposta do site. */
export function linkPreview(kpis: Kpis | null): LinkPreview | null {
  if (!kpis) return null;
  const change =
    kpis.weeks > 1
      ? { text: `${formatPct(kpis.accumulatedPct)} desde ${formatShortDate(kpis.firstWeek)}`, tone: toneOf(kpis.accumulatedPct) }
      : null;
  return {
    price: formatBRL(kpis.currentAvg),
    week: `Semana de ${formatShortDate(kpis.currentWeek)}`,
    change,
    wage: `1 salário mínimo compra ${formatKg(kpis.minWageKg.now)}`,
  };
}
