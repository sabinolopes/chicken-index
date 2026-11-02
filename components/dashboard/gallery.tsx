"use client";

import { useState } from "react";
import { BadgeCheck, Camera, ChevronDown, MapPin, TriangleAlert } from "lucide-react";
import type { ChickenPrice } from "@/lib/types";
import { formatBRL, formatDate } from "@/lib/format";
import { PhotoModal } from "./photo-modal";

const PAGE_SIZE = 12;

export function Gallery({ prices }: { prices: ChickenPrice[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<ChickenPrice | null>(null);
  const shown = prices.slice(0, visible);

  return (
    <section aria-labelledby="gallery-title">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="gallery-title" className="flex items-center gap-2 text-lg font-semibold">
            <Camera className="size-5 text-accent" aria-hidden />
            Galeria de Prova Real
          </h2>
          <p className="mt-1 text-sm text-muted">
            Cada preço tem a foto da etiqueta. Toque para ampliar e ver os dados técnicos da câmera.
          </p>
        </div>
        <span className="text-sm text-subtle tabular">
          {shown.length} de {prices.length}
        </span>
      </div>

      {prices.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-border bg-surface p-8 text-center text-muted">
          Nenhuma foto para os filtros selecionados.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setSelected(p)}
                className="group block w-full overflow-hidden rounded-xl border border-border bg-surface text-left transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-200">
                  {/* eslint-disable-next-line @next/next/no-img-element -- fotos já chegam em .webp leve; evita a cota de otimização da Vercel */}
                  <img
                    src={p.photo_url}
                    alt={`Etiqueta ${p.brand} a ${formatBRL(p.price_per_kg)}/kg em ${p.market_name}`}
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute right-2 top-2 rounded-lg bg-foreground/90 px-2 py-1 text-lg font-bold text-white tabular">
                    {formatBRL(p.price_per_kg)}
                    <span className="text-xs font-medium">/kg</span>
                  </span>
                </div>
                <div className="space-y-1.5 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{p.brand}</span>
                    <span className="text-xs text-subtle capitalize">{p.state_type}</span>
                  </div>
                  <p className="truncate text-sm text-muted">{p.market_name}</p>
                  <p className="flex items-center gap-1 text-xs text-subtle">
                    <MapPin className="size-3.5 shrink-0" aria-hidden />
                    {p.city}/{p.state} · {formatDate(p.recorded_at)}
                  </p>
                  <AuditBadge audited={p.has_valid_exif} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {visible < prices.length && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:border-stone-400"
          >
            <ChevronDown className="size-4" aria-hidden />
            Carregar mais
          </button>
        </div>
      )}

      {selected && <PhotoModal price={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}

export function AuditBadge({ audited }: { audited: boolean }) {
  return audited ? (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-800">
      <BadgeCheck className="size-3.5" aria-hidden />
      Foto Auditada (EXIF + SHA256)
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-800">
      <TriangleAlert className="size-3.5" aria-hidden />
      Sem EXIF original · SHA256
    </span>
  );
}
