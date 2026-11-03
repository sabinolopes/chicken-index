"use client";

import { useEffect, useRef } from "react";
import { Download, X } from "lucide-react";
import { Button, IconButton } from "@/components/elements/button";
import { CopyButton } from "@/components/elements/copy-button";
import { Modal } from "@/components/elements/modal";
import { formatBRL, formatPct } from "@/lib/format";
import type { Kpis } from "@/modules/dashboard/stats";
import type { EconomicSettings } from "@/modules/settings/types";
import { CARD_HEIGHT, CARD_WIDTH, drawCard } from "./draw-card";
import { shareText } from "./share-text";

interface ShareCardDialogProps {
  kpis: Kpis;
  settings: EconomicSettings;
  filterLabel: string;
  onClose: () => void;
}

/** Baixa o canvas como PNG com o nome da semana atual. */
function downloadPng(canvas: HTMLCanvasElement | null, fileName: string) {
  canvas?.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

export function ShareCardDialog({ kpis, settings, filterLabel, onClose }: ShareCardDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const site = typeof window === "undefined" ? "" : window.location.host;

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    // Espera a fonte da página para o canvas usar a mesma tipografia.
    document.fonts.ready.then(() => drawCard(context, { kpis, settings, filterLabel, site }));
  }, [kpis, settings, filterLabel, site]);

  return (
    <Modal labelledBy="share-title" onClose={onClose} className="max-h-[92vh] max-w-md rounded-2xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 id="share-title" className="font-semibold">
          Resumo para redes
        </h2>
        <IconButton label="Fechar" onClick={onClose} autoFocus>
          <X className="size-5" />
        </IconButton>
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
        <CopyButton
          text={shareText({ kpis, filterLabel, site })}
          label="Copiar texto"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium hover:border-stone-400"
        />
        <Button variant="dark" onClick={() => downloadPng(canvasRef.current, `frangometro-${kpis.currentWeek}.png`)}>
          <Download className="size-4" aria-hidden />
          Baixar PNG
        </Button>
      </div>
    </Modal>
  );
}
