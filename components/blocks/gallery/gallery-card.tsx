import { MapPin } from "lucide-react";
import { AuditBadge, PriceKindBadge } from "@/components/blocks/price-badges";
import { formatBRL, formatDate } from "@/lib/format";
import type { ChickenPrice } from "@/modules/prices/types";

/** Cartão de um preço na galeria: foto da etiqueta com o preço em destaque e os dados da coleta. */
export function GalleryCard({ price, onOpen }: { price: ChickenPrice; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group block w-full overflow-hidden rounded-xl border border-border bg-surface text-left transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-200">
        {/* eslint-disable-next-line @next/next/no-img-element -- fotos já chegam em .webp leve; evita a cota de otimização da Vercel */}
        <img
          src={price.photo_url}
          alt={`Etiqueta ${price.brand} a ${formatBRL(price.price_per_kg)}/kg em ${price.market_name}`}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {price.price_kind !== "regular" && <PriceKindBadge kind={price.price_kind} className="absolute left-2 top-2 shadow-sm" />}
        <span className="absolute right-2 top-2 rounded-lg bg-foreground/90 px-2 py-1 text-lg font-bold text-white tabular">
          {formatBRL(price.price_per_kg)}
          <span className="text-xs font-medium">/kg</span>
        </span>
      </div>
      <div className="space-y-1.5 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold">{price.brand}</span>
          <span className="text-xs text-subtle capitalize">{price.state_type}</span>
        </div>
        <p className="truncate text-sm text-muted">{price.market_name}</p>
        <p className="flex items-center gap-1 text-xs text-subtle">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          {price.city}/{price.state} · {formatDate(price.recorded_at)}
        </p>
        <AuditBadge audited={price.has_valid_exif} />
      </div>
    </button>
  );
}
