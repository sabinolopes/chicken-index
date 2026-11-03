"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Download, X } from "lucide-react";
import type { Kpis } from "@/lib/stats";
import type { EconomicSettings } from "@/lib/types";
import { formatBRL, formatKg, formatPct, formatShortDate } from "@/lib/format";

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350; // 4:5 — formato de feed do Instagram, também ok no WhatsApp

interface Props {
  kpis: Kpis;
  settings: EconomicSettings;
  filterLabel: string;
  onClose: () => void;
}

function drawCard(
  context: CanvasRenderingContext2D,
  { kpis, settings, filterLabel, site }: Omit<Props, "onClose"> & { site: string },
) {
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
  context.fillText(`Era ${formatBRL(kpis.firstAvg)} na 1ª semana`, pad, 620);

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

export function ShareCardDialog({ kpis, settings, filterLabel, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  // Endereço do site no card e no texto, para quem recebe o print saber onde conferir as fotos.
  const site = typeof window === "undefined" ? "" : window.location.host;

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    // Espera a fonte da página para o canvas usar a mesma tipografia.
    document.fonts.ready.then(() => drawCard(context, { kpis, settings, filterLabel, site }));
  }, [kpis, settings, filterLabel, site]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const download = () => {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `frangometro-${kpis.currentWeek}.png`;
      link.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const text = [
    `🐔 *Frangômetro*: preço do peito de frango${filterLabel ? ` — ${filterLabel}` : ""}`,
    `Preço médio do kg (sem promoções): *${formatBRL(kpis.currentAvg)}* (${formatPct(kpis.accumulatedPct)} desde ${formatShortDate(kpis.firstWeek)})`,
    `Salário mínimo comprava ${formatKg(kpis.minWageKg.start)}, hoje compra ${formatKg(kpis.minWageKg.now)}.`,
    `Salário médio comprava ${formatKg(kpis.avgWageKg.start)}, hoje compra ${formatKg(kpis.avgWageKg.now)}.`,
    `Fotos auditadas com EXIF + SHA-256.`,
    ...(site ? [`Veja as fotos das etiquetas: https://${site}`] : []),
  ].join("\n");

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // sem permissão de clipboard
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="share-title" className="font-semibold">
            Resumo para redes
          </h2>
          <button type="button" onClick={onClose} autoFocus aria-label="Fechar" className="rounded-lg p-1.5 text-muted hover:bg-stone-100">
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          <canvas
            ref={canvasRef}
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            className="w-full rounded-lg border border-border"
            role="img"
            aria-label={`Card: preço médio ${formatBRL(kpis.currentAvg)}, variação ${formatPct(kpis.accumulatedPct)}`}
          />
          <p className="mt-2 text-xs text-subtle">Imagem 1080×1350 — pronta para Instagram e WhatsApp. Também dá para tirar print.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-border p-4">
          <button
            type="button"
            onClick={copyText}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium hover:border-stone-400"
          >
            {copied ? <Check className="size-4 text-emerald-700" /> : <Copy className="size-4" />}
            {copied ? "Copiado!" : "Copiar texto"}
          </button>
          <button
            type="button"
            onClick={download}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-3 py-2.5 text-sm font-semibold text-white hover:bg-stone-700"
          >
            <Download className="size-4" />
            Baixar PNG
          </button>
        </div>
      </div>
    </div>
  );
}
