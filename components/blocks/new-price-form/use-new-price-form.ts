"use client";

import { useState, useTransition } from "react";
import { parsePrice, todayInBrazil } from "@/lib/parse";
import { localIsoDate, processPhoto, type ProcessedPhoto, type ProcessStep } from "@/modules/photos/process-photo";
import { createPrice } from "@/modules/prices/actions";
import type { RegisterPriceResult } from "@/modules/prices/service";
import type { MarketSuggestion } from "@/modules/prices/suggestions";
import { appendPhoto, dateDiffersFromPhoto, EMPTY_FIELDS, isReadyToSubmit, type PriceFields } from "./form-rules";
import { readLastPlace, rememberLastPlace } from "./last-place";

/** Estado e ações do cadastro de preço: foto → campos → envio → próximo cadastro. */
export function useNewPriceForm(suggestions: MarketSuggestion[]) {
  const [photo, setPhoto] = useState<ProcessedPhoto | null>(null);
  const [step, setStep] = useState<ProcessStep | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [fields, setFields] = useState<PriceFields>(EMPTY_FIELDS);
  const [result, setResult] = useState<RegisterPriceResult | null>(null);
  const [pending, startTransition] = useTransition();

  const setField = <Field extends keyof PriceFields>(field: Field, value: PriceFields[Field]) =>
    setFields((current) => ({ ...current, [field]: value }));

  function discardPhoto() {
    if (photo) URL.revokeObjectURL(photo.previewUrl);
    setPhoto(null);
  }

  /** Processa a foto escolhida (hash → EXIF → compressão) e preenche data e último mercado. */
  async function selectPhoto(file: File) {
    setPhotoError(null);
    setResult(null);
    discardPhoto();
    try {
      const processed = await processPhoto(file, setStep);
      setPhoto(processed);
      const photoDay = processed.exif.datetime ? localIsoDate(processed.exif.datetime) : todayInBrazil();
      setFields((current) => ({ ...current, recordedAt: photoDay, ...lastPlaceIfEmpty(current) }));
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "Falha ao processar a foto.");
    } finally {
      setStep(null);
    }
  }

  /** Mercado conhecido completa cidade e UF. */
  function changeMarket(market: string) {
    const known = suggestions.find((suggestion) => suggestion.market_name === market);
    setFields((current) => ({ ...current, market, ...(known && { city: known.city, uf: known.state }) }));
  }

  function submit(form: HTMLFormElement) {
    if (!photo) return;
    const formData = appendPhoto(new FormData(form), photo);
    startTransition(async () => {
      const actionResult = await createPrice(formData);
      setResult(actionResult);
      if (!actionResult.ok) return;
      rememberLastPlace({ market_name: fields.market, city: fields.city, state: fields.uf });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /** Volta ao formulário mantendo mercado, cidade e UF (o próximo preço costuma ser do mesmo lugar). */
  function resetForNext() {
    discardPhoto();
    setResult(null);
    setFields((current) => ({ ...EMPTY_FIELDS, market: current.market, city: current.city, uf: current.uf, stateType: current.stateType }));
  }

  const parsedPrice = parsePrice(fields.price);
  const photoDay = photo?.exif.datetime ? localIsoDate(photo.exif.datetime) : null;

  return {
    photo,
    step,
    photoError,
    fields,
    setField,
    result,
    pending,
    parsedPrice,
    photoDay,
    dateMismatch: dateDiffersFromPhoto(photoDay, fields.recordedAt),
    canSubmit: !pending && isReadyToSubmit({ fields, parsedPrice, photoReady: Boolean(photo) && !step }),
    selectPhoto,
    changeMarket,
    submit,
    resetForNext,
  };
}

function lastPlaceIfEmpty(fields: PriceFields): Partial<PriceFields> {
  if (fields.market) return {};
  const last = readLastPlace();
  if (!last) return {};
  return { market: last.market_name, city: last.city, uf: last.state };
}
