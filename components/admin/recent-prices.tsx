"use client";

import { useState, useTransition } from "react";
import { BadgeCheck, Loader2, Trash2, TriangleAlert } from "lucide-react";
import { deletePrice } from "@/app/admin/actions";
import { PRICE_KIND_LABEL, type ChickenPrice } from "@/lib/types";
import { formatBRL, formatDate } from "@/lib/format";

export function RecentPrices({ prices, total }: { prices: ChickenPrice[]; total: number }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function remove(price: ChickenPrice) {
    if (!confirm(`Excluir ${price.brand} ${formatBRL(price.price_per_kg)}/kg em ${price.market_name} (${formatDate(price.recorded_at)})? A foto também será apagada.`)) {
      return;
    }
    setError(null);
    setPendingId(price.id);
    startTransition(async () => {
      const result = await deletePrice(price.id);
      if (!result.ok) setError(result.error);
      setPendingId(null);
    });
  }

  return (
    <section aria-labelledby="recent-title" className="rounded-xl border border-border bg-surface">
      <div className="flex items-baseline justify-between gap-2 border-b border-border px-4 py-3">
        <h2 id="recent-title" className="font-semibold">
          Últimos cadastros
        </h2>
        <span className="text-sm text-subtle tabular">{total} no total</span>
      </div>

      {error && (
        <p role="alert" className="m-3 flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-sm text-red-800">
          <TriangleAlert className="size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      {prices.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted">Nenhum preço cadastrado ainda.</p>
      ) : (
        <ul className="divide-y divide-border">
          {prices.map((price) => (
            <li key={price.id} className="flex items-center gap-3 px-4 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- miniatura .webp já leve */}
              <img src={price.photo_url} alt="" loading="lazy" decoding="async" className="size-12 shrink-0 rounded-md bg-stone-200 object-cover" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5">
                  <span className="font-semibold tabular">{formatBRL(price.price_per_kg)}</span>
                  <span className="text-sm text-muted">{price.brand}</span>
                  {price.price_kind !== "regular" && (
                    <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[11px] font-medium text-rose-800">
                      {PRICE_KIND_LABEL[price.price_kind]}
                    </span>
                  )}
                  {price.has_valid_exif ? (
                    <BadgeCheck className="size-4 text-emerald-700" aria-label="EXIF auditado" />
                  ) : (
                    <TriangleAlert className="size-4 text-amber-700" aria-label="Sem EXIF" />
                  )}
                </p>
                <p className="truncate text-xs text-subtle">
                  {price.market_name} · {price.city}/{price.state} · {formatDate(price.recorded_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(price)}
                disabled={pendingId !== null}
                aria-label={`Excluir registro de ${price.market_name}`}
                title="Excluir"
                className="rounded-lg p-2 text-subtle hover:bg-red-50 hover:text-red-700 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                {pendingId === price.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
