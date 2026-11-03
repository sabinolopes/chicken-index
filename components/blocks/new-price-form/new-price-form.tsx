"use client";

import { Loader2, Send } from "lucide-react";
import { Alert } from "@/components/elements/alert";
import { Button } from "@/components/elements/button";
import type { MarketSuggestion } from "@/modules/prices/suggestions";
import { PhotoStep } from "./photo-step";
import { PlaceStep } from "./place-step";
import { ProductStep } from "./product-step";
import { SuccessPanel } from "./success-panel";
import { useNewPriceForm } from "./use-new-price-form";

/** Cadastro mobile em três etapas. Os campos só liberam depois que a foto foi processada. */
export function NewPriceForm({ suggestions }: { suggestions: MarketSuggestion[] }) {
  const form = useNewPriceForm(suggestions);
  const { result } = form;

  if (result?.ok) return <SuccessPanel message={result.message} record={result.record} onNext={form.resetForNext} />;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        form.submit(event.currentTarget);
      }}
      className="space-y-5 pb-24 sm:pb-0"
    >
      <PhotoStep photo={form.photo} step={form.step} error={form.photoError} onSelect={form.selectPhoto} />
      <ProductStep fields={form.fields} setField={form.setField} parsedPrice={form.parsedPrice} disabled={!form.photo} />
      <PlaceStep
        fields={form.fields}
        setField={form.setField}
        onMarketChange={form.changeMarket}
        suggestions={suggestions}
        photoDay={form.photoDay}
        dateMismatch={form.dateMismatch}
        disabled={!form.photo}
      />

      {result && !result.ok && <Alert tone="error">{result.error}</Alert>}

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface/95 p-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0">
        <Button type="submit" variant="primary" disabled={!form.canSubmit}>
          {form.pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Send className="size-5" aria-hidden />}
          {form.pending ? "Enviando…" : "Publicar preço"}
        </Button>
      </div>
    </form>
  );
}
