"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { BadgeCheck, Loader2, Pencil, Trash2, TriangleAlert } from "lucide-react";
import { EditPriceDialog } from "@/components/blocks/edit-price";
import { Alert } from "@/components/elements/alert";
import { Button, buttonClass, IconButton } from "@/components/elements/button";
import { Panel, PanelHeader } from "@/components/elements/panel";
import { formatBRL, formatDate } from "@/lib/format";
import { deletePrice } from "@/modules/prices/actions";
import type { FormSuggestions } from "@/modules/prices/queries";
import { PRICE_KIND_LABEL, type ChickenPrice } from "@/modules/prices/types";
import { MAX_SHOWN, nextShownCount, PAGE_SIZE } from "./page-size";

interface RecentPricesProps {
  prices: ChickenPrice[];
  total: number;
  /** Mercados e marcas já usados, para o autocompletar da correção. */
  suggestions: FormSuggestions;
}

/** Últimos cadastros com correção dos dados e exclusão (registro e foto, sempre pedindo confirmação). */
export function RecentPrices({ prices, total, suggestions }: RecentPricesProps) {
  const [editing, setEditing] = useState<ChickenPrice | null>(null);
  /** Registro com a confirmação de exclusão aberta na própria linha. */
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Confirmação na própria linha, não com window.confirm: o navegador embutido do WhatsApp
  // e do Instagram não mostra a janela e responde "cancelar" sozinho, e a lixeira parecia não funcionar.
  function remove(price: ChickenPrice) {
    setConfirmingId(null);
    setError(null);
    setPendingId(price.id);
    startTransition(async () => {
      const result = await deletePrice(price.id);
      if (!result.ok) setError(result.error);
      setPendingId(null);
    });
  }

  return (
    <Panel labelledBy="recent-title" padding="none">
      <PanelHeader id="recent-title" title="Últimos cadastros" bar aside={<span className="text-sm text-subtle tabular">{total} no total</span>} />

      {error && (
        <Alert tone="error" className="m-3">
          {error}
        </Alert>
      )}

      {prices.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted">Nenhum preço cadastrado ainda.</p>
      ) : (
        <ul className="divide-y divide-border">
          {prices.map((price) => (
            <li key={price.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- miniatura .webp já leve */}
              <img src={price.photo_url} alt="" loading="lazy" decoding="async" className="size-12 shrink-0 rounded-md bg-stone-200 object-cover" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5">
                  <span className="font-semibold tabular">{formatBRL(price.price_per_kg)}</span>
                  <span className="text-sm text-muted">{price.brand}</span>
                  {price.price_kind !== "regular" && (
                    <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[11px] font-medium text-rose-800">{PRICE_KIND_LABEL[price.price_kind]}</span>
                  )}
                  {price.has_valid_exif ? (
                    <BadgeCheck className="size-4 text-emerald-700" aria-label="EXIF auditado" />
                  ) : (
                    <TriangleAlert className="size-4 text-amber-700" aria-label="Sem EXIF" />
                  )}
                </p>
                <p className="truncate text-xs text-subtle">
                  {price.market_name} · {price.city}/{price.state} · {formatDate(price.recorded_at)}
                  {price.updated_at && " · corrigido"}
                </p>
              </div>
              <IconButton label={`Corrigir registro de ${price.market_name}`} onClick={() => setEditing(price)} disabled={pendingId !== null}>
                <Pencil className="size-4" />
              </IconButton>
              <IconButton
                tone="danger"
                label={`Excluir registro de ${price.market_name}`}
                onClick={() => setConfirmingId(price.id)}
                disabled={pendingId !== null}
                aria-expanded={confirmingId === price.id}
              >
                {pendingId === price.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              </IconButton>
              {confirmingId === price.id && (
                <div role="group" aria-label="Confirmar exclusão" className="flex basis-full flex-wrap items-center justify-end gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm">
                  <span className="mr-auto text-red-800">
                    Excluir {formatBRL(price.price_per_kg)} em {price.market_name} ({formatDate(price.recorded_at)})? A foto também será apagada.
                  </span>
                  <Button onClick={() => setConfirmingId(null)}>Cancelar</Button>
                  <Button onClick={() => remove(price)} className="border-red-300 text-red-700 hover:border-red-500">
                    <Trash2 className="size-4" aria-hidden />
                    Excluir
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {prices.length > 0 && <ListFooter shown={prices.length} total={total} />}

      {editing && <EditPriceDialog price={editing} suggestions={suggestions} onClose={() => setEditing(null)} />}
    </Panel>
  );
}

/**
 * Rodapé da lista: quantos estão na tela e o "Mostrar mais". A quantidade vai na URL
 * (`?mostrar=`), então editar ou excluir recarrega a lista certa do servidor.
 */
function ListFooter({ shown, total }: { shown: number; total: number }) {
  const next = nextShownCount(shown, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-sm text-subtle">
      <span className="tabular">
        {shown >= MAX_SHOWN && total > MAX_SHOWN ? `Mostrando os ${MAX_SHOWN} mais recentes` : `Mostrando ${shown} de ${total}`}
      </span>
      {next !== null && (
        <Link href={`/admin?mostrar=${next}`} scroll={false} className={buttonClass("secondary")}>
          Mostrar mais {Math.min(PAGE_SIZE, total - shown)}
        </Link>
      )}
    </div>
  );
}
