"use client";

import { Loader2, Save, X } from "lucide-react";
import { PlaceStep, ProductStep } from "@/components/blocks/new-price-form";
import { Alert } from "@/components/elements/alert";
import { Button, IconButton } from "@/components/elements/button";
import { Modal } from "@/components/elements/modal";
import type { FormSuggestions } from "@/modules/prices/queries";
import type { ChickenPrice } from "@/modules/prices/types";
import { useEditPrice } from "./use-edit-price";

interface EditPriceDialogProps {
  price: ChickenPrice;
  suggestions: FormSuggestions;
  onClose: () => void;
}

/** Corrige os dados de um cadastro olhando a foto da etiqueta. A foto e a auditoria não mudam. */
export function EditPriceDialog({ price, suggestions, onClose }: EditPriceDialogProps) {
  const edit = useEditPrice({ price, markets: suggestions.markets, onSaved: onClose });

  return (
    <Modal labelledBy="edit-price-title" onClose={onClose} placement="sheet" className="max-h-[94vh] max-w-lg rounded-t-2xl sm:rounded-2xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 id="edit-price-title" className="font-semibold">
          Corrigir cadastro
        </h2>
        <IconButton label="Fechar" onClick={onClose}>
          <X className="size-5" />
        </IconButton>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          edit.submit(event.currentTarget);
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="space-y-5 overflow-y-auto p-4">
          <a href={price.photo_url} target="_blank" rel="noreferrer" className="block" title="Abrir a foto em tamanho real">
            {/* eslint-disable-next-line @next/next/no-img-element -- .webp já leve, servido direto do R2 */}
            <img
              src={price.photo_url}
              alt={`Etiqueta fotografada em ${price.market_name}`}
              decoding="async"
              className="max-h-[40vh] w-full rounded-lg bg-stone-200 object-contain"
            />
          </a>
          <p className="-mt-3 text-xs text-subtle">Confira na foto. Ela, o hash e os dados da câmera não mudam.</p>

          <ProductStep
            fields={edit.fields}
            setField={edit.setField}
            parsedPrice={edit.parsedPrice}
            brandSuggestions={suggestions.brands}
            disabled={edit.pending}
            legend="Preço e produto"
            focusOtherBrand={false}
          />
          <PlaceStep
            fields={edit.fields}
            setField={edit.setField}
            onMarketChange={edit.changeMarket}
            suggestions={suggestions.markets}
            photoDay={edit.photoDay}
            dateMismatch={edit.dateMismatch}
            disabled={edit.pending}
            legend="Local e data"
          />
        </div>

        <div className="space-y-3 border-t border-border p-4">
          {edit.error && <Alert tone="error">{edit.error}</Alert>}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={onClose} disabled={edit.pending}>
              Cancelar
            </Button>
            <Button type="submit" variant="dark" disabled={!edit.canSave}>
              {edit.pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
              Salvar correção
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
