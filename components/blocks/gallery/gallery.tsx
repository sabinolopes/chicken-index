"use client";

import { useState } from "react";
import { Camera, ChevronDown } from "lucide-react";
import { PhotoModal } from "@/components/blocks/photo-modal";
import { PanelHeader } from "@/components/elements/panel";
import type { ChickenPrice } from "@/modules/prices/types";
import { GalleryCard } from "./gallery-card";

/** Fotos por "página": a galeria começa com as 12 mais recentes (CLAUDE.md, regra de escalabilidade 3). */
export const GALLERY_PAGE_SIZE = 12;

export function Gallery({ prices }: { prices: ChickenPrice[] }) {
  const [visibleCount, setVisibleCount] = useState(GALLERY_PAGE_SIZE);
  const [selected, setSelected] = useState<ChickenPrice | null>(null);
  const shown = prices.slice(0, visibleCount);

  return (
    <section aria-labelledby="gallery-title">
      <PanelHeader
        id="gallery-title"
        size="lg"
        icon={<Camera className="size-5 text-accent" aria-hidden />}
        title="Galeria de Prova Real"
        description="Cada preço tem a foto da etiqueta. Toque para ampliar e ver os dados técnicos da câmera."
        aside={
          <span className="self-end text-sm text-subtle tabular">
            {shown.length} de {prices.length}
          </span>
        }
      />

      {prices.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-border bg-surface p-8 text-center text-muted">
          Nenhuma foto para os filtros selecionados.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((price) => (
            <li key={price.id}>
              <GalleryCard price={price} onOpen={() => setSelected(price)} />
            </li>
          ))}
        </ul>
      )}

      {visibleCount < prices.length && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + GALLERY_PAGE_SIZE)}
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
