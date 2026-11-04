"use client";

import { useState, useTransition } from "react";
import { dateDiffersFromPhoto, isReadyToSubmit, type PriceFields } from "@/components/blocks/new-price-form";
import { parsePrice } from "@/lib/parse";
import { updatePrice } from "@/modules/prices/actions";
import type { MarketSuggestion } from "@/modules/prices/suggestions";
import type { ChickenPrice } from "@/modules/prices/types";
import { fieldsFromPrice, photoDayOf } from "./edit-rules";

interface UseEditPriceOptions {
  price: ChickenPrice;
  markets: MarketSuggestion[];
  onSaved: () => void;
}

/** Estado e envio da correção de um cadastro. */
export function useEditPrice({ price, markets, onSaved }: UseEditPriceOptions) {
  const [fields, setFields] = useState<PriceFields>(() => fieldsFromPrice(price));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const setField = <Field extends keyof PriceFields>(field: Field, value: PriceFields[Field]) =>
    setFields((current) => ({ ...current, [field]: value }));

  /** Mercado conhecido completa cidade e UF, como no cadastro. */
  function changeMarket(market: string) {
    const known = markets.find((suggestion) => suggestion.market_name === market);
    setFields((current) => ({ ...current, market, ...(known && { city: known.city, uf: known.state }) }));
  }

  function submit(form: HTMLFormElement) {
    setError(null);
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await updatePrice(price.id, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved();
    });
  }

  const parsedPrice = parsePrice(fields.price);
  const photoDay = photoDayOf(price);

  return {
    fields,
    setField,
    changeMarket,
    submit,
    error,
    pending,
    parsedPrice,
    photoDay,
    dateMismatch: dateDiffersFromPhoto(photoDay, fields.recordedAt),
    canSave: !pending && isReadyToSubmit({ fields, parsedPrice, photoReady: true }),
  };
}
