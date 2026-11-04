import type { Kpis } from "@/modules/dashboard/stats";
import type { EconomicSettings } from "@/modules/settings/types";
import { formatBRL, formatKg, formatPct, formatShortDate } from "@/lib/format";

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350; // 4:5 — formato de feed do Instagram, também ok no WhatsApp

export interface ShareSummary {
  kpis: Kpis;
  settings: EconomicSettings;
  /** Recorte dos filtros (vazio = todos os mercados). */
  filterLabel: string;
  /** Endereço do site, para quem recebe o print saber onde conferir as fotos. */
  site: string;
}

/** Desenha o card 1080×1350 no canvas (mesmas cores e fonte do site). */
export function drawCard(context: CanvasRenderingContext2D, { kpis, settings, filterLabel, site }: ShareSummary) {
  const font = (weight: number, size: number) => `${weight} ${size}px "Geist", Arial, Helvetica, sans-serif`;
  const pad = 88;

  context.fillStyle = "#f7f5f1";
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  context.fillStyle = "#b42318";
  context.fillRect(0, 0, CARD_WIDTH, 16);

  context.textBaseline = "alphabetic";
  context.fillStyle = "#b42318";
  context.font = font(700, 30);
  context.fillText("FRANGÔMETRO · PEITO DE FRANGO", pad, 120);
  if (site) {
    context.fillStyle = "#8a847d";
    context.font = font(500, 28);
    context.textAlign = "right";
    context.fillText(site, CARD_WIDTH - pad, 120);
    context.textAlign = "left";
  }

  context.fillStyle = "#57534e";
  context.font = font(400, 32);
  context.fillText(filterLabel || "Média de todos os mercados monitorados", pad, 170);

  context.fillStyle = "#1c1917";
  context.font = font(500, 36);
  context.fillText("Preço médio do kg hoje (sem promoções)", pad, 290);
  context.font = font(800, 150);
  context.fillText(formatBRL(kpis.currentAvg), pad - 6, 440);

  // Variação acumulada
  const up = kpis.accumulatedPct > 0;
  context.fillStyle = up ? "#fde8e7" : "#e7f6ee";
  const pillText = `${up ? "▲" : "▼"} ${formatPct(kpis.accumulatedPct)} desde ${formatShortDate(kpis.firstWeek)}`;
  context.font = font(700, 40);
  const pillW = context.measureText(pillText).width + 56;
  context.beginPath();
  context.roundRect(pad, 485, pillW, 76, 38);
  context.fill();
  context.fillStyle = up ? "#b42318" : "#047857";
  context.fillText(pillText, pad + 28, 537);

  context.fillStyle = "#57534e";
  context.font = font(400, 32);
  context.fillText("Variação nos mesmos mercados e marcas", pad, 620);

  // Termômetro salarial
  context.strokeStyle = "#e7e2da";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(pad, 690);
  context.lineTo(CARD_WIDTH - pad, 690);
  context.stroke();

  context.fillStyle = "#1c1917";
  context.font = font(700, 40);
  context.fillText("Quanto frango o salário compra", pad, 770);

  const rows = [
    { label: `Salário mínimo (${formatBRL(settings.min_wage)})`, kg: kpis.minWageKg },
    { label: `Salário médio (${formatBRL(settings.avg_wage)})`, kg: kpis.avgWageKg },
  ];
  rows.forEach(({ label, kg }, index) => {
    const rowTop = 860 + index * 190;
    context.fillStyle = "#57534e";
    context.font = font(500, 32);
    context.fillText(label, pad, rowTop);

    context.fillStyle = "#1c1917";
    context.font = font(800, 64);
    const before = `${formatKg(kg.start)} → `;
    context.fillText(before, pad, rowTop + 80);
    const beforeWidth = context.measureText(before).width;
    context.fillStyle = "#b42318";
    context.fillText(formatKg(kg.now), pad + beforeWidth, rowTop + 80);

    context.fillStyle = "#57534e";
    context.font = font(500, 32);
    context.textAlign = "right";
    context.fillText(formatPct(kg.deltaPct), CARD_WIDTH - pad, rowTop + 74);
    context.textAlign = "left";
  });

  context.fillStyle = "#8a847d";
  context.font = font(400, 28);
  context.fillText(`${kpis.records} etiquetas fotografadas · ${kpis.audited} com EXIF auditado + SHA-256`, pad, CARD_HEIGHT - 120);
  context.fillText(`${kpis.weeks} semanas · semana atual: ${formatShortDate(kpis.currentWeek)}`, pad, CARD_HEIGHT - 76);
}
