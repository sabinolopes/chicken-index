"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Download, X } from "lucide-react";
import type { Kpis } from "@/lib/stats";
import type { EconomicSettings } from "@/lib/types";
import { formatBRL, formatKg, formatPct, formatShortDate } from "@/lib/format";

const W = 1080;
const H = 1350; // 4:5 — formato de feed do Instagram, também ok no WhatsApp

interface Props {
  kpis: Kpis;
  settings: EconomicSettings;
  filterLabel: string;
  onClose: () => void;
}

function drawCard(ctx: CanvasRenderingContext2D, { kpis, settings, filterLabel }: Omit<Props, "onClose">) {
  const font = (weight: number, size: number) => `${weight} ${size}px "Geist", Arial, Helvetica, sans-serif`;
  const pad = 88;

  ctx.fillStyle = "#f7f5f1";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#b42318";
  ctx.fillRect(0, 0, W, 16);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#b42318";
  ctx.font = font(700, 30);
  ctx.fillText("ÍNDICE DO PEITO DE FRANGO", pad, 120);

  ctx.fillStyle = "#57534e";
  ctx.font = font(400, 32);
  ctx.fillText(filterLabel || "Média de todos os mercados monitorados", pad, 170);

  ctx.fillStyle = "#1c1917";
  ctx.font = font(500, 36);
  ctx.fillText("Preço médio do kg hoje", pad, 290);
  ctx.font = font(800, 150);
  ctx.fillText(formatBRL(kpis.currentAvg), pad - 6, 440);

  // Variação acumulada
  const up = kpis.accumulatedPct > 0;
  ctx.fillStyle = up ? "#fde8e7" : "#e7f6ee";
  const pillText = `${up ? "▲" : "▼"} ${formatPct(kpis.accumulatedPct)} desde ${formatShortDate(kpis.firstWeek)}`;
  ctx.font = font(700, 40);
  const pillW = ctx.measureText(pillText).width + 56;
  ctx.beginPath();
  ctx.roundRect(pad, 485, pillW, 76, 38);
  ctx.fill();
  ctx.fillStyle = up ? "#b42318" : "#047857";
  ctx.fillText(pillText, pad + 28, 537);

  ctx.fillStyle = "#57534e";
  ctx.font = font(400, 32);
  ctx.fillText(`Era ${formatBRL(kpis.firstAvg)} na 1ª semana`, pad, 620);

  // Termômetro salarial
  ctx.strokeStyle = "#e7e2da";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, 690);
  ctx.lineTo(W - pad, 690);
  ctx.stroke();

  ctx.fillStyle = "#1c1917";
  ctx.font = font(700, 40);
  ctx.fillText("Quanto frango o salário compra", pad, 770);

  const rows = [
    { label: `Salário mínimo (${formatBRL(settings.min_wage)})`, kg: kpis.minWageKg },
    { label: `Salário médio (${formatBRL(settings.avg_wage)})`, kg: kpis.avgWageKg },
  ];
  rows.forEach(({ label, kg }, i) => {
    const y = 860 + i * 190;
    ctx.fillStyle = "#57534e";
    ctx.font = font(500, 32);
    ctx.fillText(label, pad, y);

    ctx.fillStyle = "#1c1917";
    ctx.font = font(800, 64);
    const before = `${formatKg(kg.start)} → `;
    ctx.fillText(before, pad, y + 80);
    const bw = ctx.measureText(before).width;
    ctx.fillStyle = "#b42318";
    ctx.fillText(formatKg(kg.now), pad + bw, y + 80);

    ctx.fillStyle = "#57534e";
    ctx.font = font(500, 32);
    ctx.textAlign = "right";
    ctx.fillText(formatPct(kg.deltaPct), W - pad, y + 74);
    ctx.textAlign = "left";
  });

  ctx.fillStyle = "#8a847d";
  ctx.font = font(400, 28);
  ctx.fillText(`${kpis.records} etiquetas fotografadas · ${kpis.audited} com EXIF auditado + SHA-256`, pad, H - 120);
  ctx.fillText(`${kpis.weeks} semanas · semana atual: ${formatShortDate(kpis.currentWeek)}`, pad, H - 76);
}

export function ShareCardDialog({ kpis, settings, filterLabel, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    // Espera a fonte da página para o canvas usar a mesma tipografia.
    document.fonts.ready.then(() => drawCard(ctx, { kpis, settings, filterLabel }));
  }, [kpis, settings, filterLabel]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const download = () => {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `indice-peito-de-frango-${kpis.currentWeek}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const text = [
    `🐔 *Índice do Peito de Frango*${filterLabel ? ` — ${filterLabel}` : ""}`,
    `Preço médio do kg: *${formatBRL(kpis.currentAvg)}* (${formatPct(kpis.accumulatedPct)} desde ${formatShortDate(kpis.firstWeek)})`,
    `Salário mínimo comprava ${formatKg(kpis.minWageKg.start)}, hoje compra ${formatKg(kpis.minWageKg.now)}.`,
    `Salário médio comprava ${formatKg(kpis.avgWageKg.start)}, hoje compra ${formatKg(kpis.avgWageKg.now)}.`,
    `Fotos auditadas com EXIF + SHA-256.`,
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
        onClick={(e) => e.stopPropagation()}
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
            width={W}
            height={H}
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
