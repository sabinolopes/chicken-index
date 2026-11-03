"use client";

import { Calendar, ExternalLink, MapPin, Store, X } from "lucide-react";
import { PriceKindBadge } from "@/components/blocks/price-badges";
import { IconButton } from "@/components/elements/button";
import { Modal } from "@/components/elements/modal";
import { formatBRL, formatDate, formatDateTime } from "@/lib/format";
import type { ChickenPrice } from "@/modules/prices/types";
import { AuditPanel } from "./audit-panel";
import { DetailRow } from "./detail-row";
import { ZoomablePhoto } from "./zoomable-photo";

/** Prova de um preço: a etiqueta com lupa ao lado dos dados da coleta e da auditoria. */
export function PhotoModal({ price, onClose }: { price: ChickenPrice; onClose: () => void }) {
  return (
    <Modal
      labelledBy="photo-modal-title"
      onClose={onClose}
      placement="sheet"
      className="max-h-[100dvh] max-w-5xl rounded-t-2xl sm:max-h-[92vh] sm:rounded-2xl lg:flex-row"
    >
      <ZoomablePhoto src={price.photo_url} alt={`Etiqueta ${price.brand} a ${formatBRL(price.price_per_kg)}/kg`} />

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
          <IconButton label="Fechar" onClick={onClose} autoFocus>
            <X className="size-5" />
          </IconButton>
        </div>

        <dl className="space-y-3 p-4 text-sm">
          <DetailRow icon={<Store className="size-4" />} label="Mercado" value={price.market_name} />
          <DetailRow icon={<MapPin className="size-4" />} label="Local" value={`${price.city}/${price.state}`} />
          <DetailRow icon={<Calendar className="size-4" />} label="Data da coleta" value={formatDate(price.recorded_at)} />
        </dl>

        <AuditPanel price={price} />

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border p-4 text-xs text-subtle">
          <span>Cadastrado em {formatDateTime(price.created_at)}</span>
          <a href={price.photo_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-foreground hover:underline">
            Abrir foto <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
      </div>
    </Modal>
  );
}
