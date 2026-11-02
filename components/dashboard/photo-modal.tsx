"use client";

import { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Check,
  Copy,
  ExternalLink,
  Fingerprint,
  MapPin,
  RotateCcw,
  Smartphone,
  Store,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { ChickenPrice } from "@/lib/types";
import { formatBRL, formatDate, formatDateTime } from "@/lib/format";
import { AuditBadge, PriceKindBadge } from "./gallery";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const CLICK_ZOOM = 2.5;

export function PhotoModal({ price, onClose }: { price: ChickenPrice; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [copied, setCopied] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(MAX_ZOOM, z + 0.5));
      if (e.key === "-") setZoom((z) => Math.max(MIN_ZOOM, z - 0.5));
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const pointerToOrigin = (clientX: number, clientY: number) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return origin;
    return {
      x: Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100)),
    };
  };

  const copyHash = async () => {
    try {
      await navigator.clipboard.writeText(price.original_sha256);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard indisponível (ex.: http sem TLS) — o hash continua selecionável
    }
  };

  const zoomed = zoom > 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="photo-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[100dvh] sm:max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl bg-surface shadow-2xl lg:flex-row"
      >
        {/* Foto com lupa */}
        <div className="relative flex min-h-0 flex-1 flex-col bg-stone-900">
          <div
            ref={frameRef}
            className={`relative aspect-[4/3] w-full overflow-hidden lg:aspect-auto lg:flex-1 ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
            style={{ touchAction: zoomed ? "none" : "manipulation" }}
            onClick={(e) => {
              if (zoomed) {
                setZoom(1);
              } else {
                setOrigin(pointerToOrigin(e.clientX, e.clientY));
                setZoom(CLICK_ZOOM);
              }
            }}
            onPointerMove={(e) => {
              if (zoomed) setOrigin(pointerToOrigin(e.clientX, e.clientY));
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- foto .webp já otimizada no upload */}
            <img
              src={price.photo_url}
              alt={`Etiqueta ${price.brand} a ${formatBRL(price.price_per_kg)}/kg`}
              decoding="async"
              draggable={false}
              className="absolute inset-0 size-full select-none object-contain transition-transform duration-150 ease-out"
              style={{ transform: `scale(${zoom})`, transformOrigin: `${origin.x}% ${origin.y}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-2 bg-stone-900 px-3 py-2 text-stone-200">
            <span className="text-xs text-stone-400">
              {zoomed ? "Mova o cursor / arraste para explorar" : "Clique ou toque na etiqueta para ampliar"}
            </span>
            <div className="flex items-center gap-1">
              <IconButton label="Diminuir zoom" onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.5))} disabled={zoom <= MIN_ZOOM}>
                <ZoomOut className="size-4" />
              </IconButton>
              <span className="w-12 text-center text-xs tabular">{Math.round(zoom * 100)}%</span>
              <IconButton label="Aumentar zoom" onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.5))} disabled={zoom >= MAX_ZOOM}>
                <ZoomIn className="size-4" />
              </IconButton>
              <IconButton
                label="Restaurar"
                onClick={() => {
                  setZoom(1);
                  setOrigin({ x: 50, y: 50 });
                }}
                disabled={!zoomed}
              >
                <RotateCcw className="size-4" />
              </IconButton>
            </div>
          </div>
        </div>

        {/* Dados técnicos */}
        <div className="flex w-full flex-col overflow-y-auto lg:w-[22rem] lg:shrink-0">
          <div className="flex items-start justify-between gap-3 border-b border-border p-4">
            <div>
              <p id="photo-modal-title" className="text-3xl font-bold tracking-tight tabular">
                {formatBRL(price.price_per_kg)}
                <span className="text-base font-medium text-subtle">/kg</span>
              </p>
              <p className="mt-0.5 text-sm text-muted">
                {price.brand} · <span className="capitalize">{price.state_type}</span>
              </p>
              {price.price_kind !== "regular" && (
                <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                  <PriceKindBadge kind={price.price_kind} />
                  fora do índice de inflação
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              autoFocus
              aria-label="Fechar"
              className="rounded-lg p-1.5 text-muted hover:bg-stone-100 hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>

          <dl className="space-y-3 p-4 text-sm">
            <Row icon={<Store className="size-4" />} label="Mercado" value={price.market_name} />
            <Row icon={<MapPin className="size-4" />} label="Local" value={`${price.city}/${price.state}`} />
            <Row icon={<Calendar className="size-4" />} label="Data da coleta" value={formatDate(price.recorded_at)} />
          </dl>

          <div className="mx-4 mb-4 rounded-xl border border-border bg-background p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Auditoria da foto</h3>
              <AuditBadge audited={price.has_valid_exif} />
            </div>

            <dl className="mt-3 space-y-3 text-sm">
              <Row
                icon={<Smartphone className="size-4" />}
                label="Aparelho (EXIF Make/Model)"
                value={price.exif_device ?? "Não disponível"}
                muted={!price.exif_device}
              />
              <Row
                icon={<Calendar className="size-4" />}
                label="Capturada em (EXIF DateTimeOriginal)"
                value={price.exif_datetime ? formatDateTime(price.exif_datetime) : "Não disponível"}
                muted={!price.exif_datetime}
              />
              <div>
                <dt className="flex items-center gap-1.5 text-subtle">
                  <Fingerprint className="size-4" aria-hidden />
                  SHA-256 do arquivo original
                </dt>
                <dd className="mt-1 flex items-start gap-2">
                  <code className="min-w-0 flex-1 break-all rounded-md bg-surface px-2 py-1.5 font-mono text-[11px] leading-relaxed text-foreground border border-border">
                    {price.original_sha256}
                  </code>
                  <button
                    type="button"
                    onClick={copyHash}
                    aria-label="Copiar hash"
                    className="rounded-md border border-border bg-surface p-1.5 text-muted hover:text-foreground"
                  >
                    {copied ? <Check className="size-4 text-emerald-700" /> : <Copy className="size-4" />}
                  </button>
                </dd>
              </div>
            </dl>

            {!price.has_valid_exif && (
              <p className="mt-3 rounded-md bg-amber-50 p-2 text-xs text-amber-900">
                Esta foto chegou sem metadados de câmera (ex.: repassada por WhatsApp). O hash SHA-256 ainda identifica o
                arquivo recebido, mas não há como confirmar aparelho e horário da captura.
              </p>
            )}
            <p className="mt-3 text-xs text-subtle">
              O hash foi calculado no navegador sobre o arquivo original, antes da compressão para .webp. Quem tiver o
              original pode conferir com <code className="font-mono">sha256sum foto.jpg</code>.
            </p>
          </div>

          <div className="mt-auto border-t border-border p-4 text-xs text-subtle flex items-center justify-between gap-2">
            <span>Cadastrado em {formatDateTime(price.created_at)}</span>
            <a
              href={price.photo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-foreground hover:underline"
            >
              Abrir foto <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value, muted = false }: { icon: React.ReactNode; label: string; value: string; muted?: boolean }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-subtle">
        <span aria-hidden>{icon}</span>
        {label}
      </dt>
      <dd className={`mt-0.5 pl-[22px] ${muted ? "text-subtle italic" : "font-medium"}`}>{value}</dd>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="rounded-md p-1.5 hover:bg-white/10 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
