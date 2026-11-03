import { Minus, TrendingDown, TrendingUp } from "lucide-react";

// Abaixo de 0,05% a variação é tratada como estável.
export const STABLE_THRESHOLD = 0.05;

const TRENDS = {
  up: { Icon: TrendingUp, tone: "text-red-700 bg-red-50", label: "alta" },
  down: { Icon: TrendingDown, tone: "text-emerald-700 bg-emerald-50", label: "queda" },
  stable: { Icon: Minus, tone: "text-muted bg-stone-100", label: "estável" },
} as const;

/** Direção da variação de preço: subir é ruim (vermelho), cair é bom (verde). */
export function trendOf(pct: number) {
  if (pct > STABLE_THRESHOLD) return TRENDS.up;
  if (pct < -STABLE_THRESHOLD) return TRENDS.down;
  return TRENDS.stable;
}
