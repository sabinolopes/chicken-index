"use client";

import { useRef, useState, useTransition } from "react";
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  Fingerprint,
  ImagePlus,
  Loader2,
  RotateCcw,
  Send,
  Smartphone,
  TriangleAlert,
} from "lucide-react";
import { createPrice, type ActionResult } from "@/app/admin/actions";
import type { MarketSuggestion } from "@/lib/admin-data";
import { BRANDS, PRICE_KIND_LABEL, PRICE_KINDS, type PriceKind, type StateType } from "@/lib/types";
import { UFS, parsePrice, todayInBrazil } from "@/lib/validation";
import { formatBRL, formatDate, formatDateTime } from "@/lib/format";
import { localIsoDate, processPhoto, type ProcessStep, type ProcessedPhoto } from "@/lib/upload/process-photo";
import { MoneyInput } from "./money-input";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "./ui";

const LAST_PLACE_KEY = "admin:last-place";
const STEP_LABEL: Record<ProcessStep, string> = {
  hash: "Calculando SHA-256 do original…",
  exif: "Lendo metadados EXIF…",
  compress: "Comprimindo para .webp…",
};

const kb = (bytes: number) => `${Math.round(bytes / 1024).toLocaleString("pt-BR")} KB`;

function readLastPlace(): MarketSuggestion | null {
  try {
    const raw = localStorage.getItem(LAST_PLACE_KEY);
    return raw ? (JSON.parse(raw) as MarketSuggestion) : null;
  } catch {
    return null;
  }
}

export function NewPriceForm({ suggestions }: { suggestions: MarketSuggestion[] }) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<ProcessedPhoto | null>(null);
  const [step, setStep] = useState<ProcessStep | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [price, setPrice] = useState("");
  const [brand, setBrand] = useState("");
  const [stateType, setStateType] = useState<StateType>("resfriado");
  const [priceKind, setPriceKind] = useState<PriceKind>("regular");
  const [market, setMarket] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [recordedAt, setRecordedAt] = useState("");

  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  const markets = [...new Set(suggestions.map((s) => s.market_name))];
  const cities = [...new Set(suggestions.map((s) => s.city))];

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setPhotoError(null);
    setResult(null);
    if (photo) URL.revokeObjectURL(photo.previewUrl);
    setPhoto(null);

    try {
      const processed = await processPhoto(file, setStep);
      setPhoto(processed);
      setRecordedAt(processed.exif.datetime ? localIsoDate(processed.exif.datetime) : todayInBrazil());

      if (!market) {
        const last = readLastPlace();
        if (last) {
          setMarket(last.market_name);
          setCity(last.city);
          setUf(last.state);
        }
      }
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Falha ao processar a foto.");
    } finally {
      setStep(null);
      if (cameraRef.current) cameraRef.current.value = "";
      if (galleryRef.current) galleryRef.current.value = "";
    }
  }

  function handleMarketChange(value: string) {
    setMarket(value);
    const known = suggestions.find((s) => s.market_name === value);
    if (known) {
      setCity(known.city);
      setUf(known.state);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!photo) return;

    const fd = new FormData(e.currentTarget);
    const ext = photo.compressed.type === "image/webp" ? "webp" : "jpg";
    fd.set("photo", new File([photo.compressed], `etiqueta.${ext}`, { type: photo.compressed.type }));
    fd.set("original_sha256", photo.sha256);
    fd.set("has_valid_exif", String(photo.hasValidExif));
    fd.set("exif_device", photo.exif.device ?? "");
    fd.set("exif_datetime", photo.exif.datetime?.toISOString() ?? "");

    startTransition(async () => {
      const res = await createPrice(fd);
      setResult(res);
      if (res.ok) {
        try {
          localStorage.setItem(LAST_PLACE_KEY, JSON.stringify({ market_name: market, city, state: uf }));
        } catch {
          // armazenamento indisponível (aba anônima)
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  function resetForNext() {
    if (photo) URL.revokeObjectURL(photo.previewUrl);
    setPhoto(null);
    setPrice("");
    setBrand("");
    setPriceKind("regular");
    setResult(null);
    setRecordedAt("");
  }

  // ---------------------------------------------------------------- sucesso
  if (result?.ok && result.record) {
    const r = result.record;
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="flex items-start gap-2 font-medium">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden />
            {result.message}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 text-sm">
          <p className="text-3xl font-bold tabular">
            {formatBRL(r.price_per_kg)}
            <span className="text-base font-medium text-subtle">/kg</span>
          </p>
          <p className="mt-1 text-muted">
            {r.brand} · {r.state_type} · {PRICE_KIND_LABEL[r.price_kind]} · {r.market_name} · {r.city}/{r.state} · {formatDate(r.recorded_at)}
          </p>
          <p className="mt-2 break-all font-mono text-[11px] text-subtle">SHA-256 {r.original_sha256}</p>
        </div>
        <button type="button" onClick={resetForNext} className={primaryButtonClass}>
          <Camera className="size-5" aria-hidden />
          Cadastrar outra etiqueta
        </button>
        <p className="text-center text-xs text-subtle">Mercado, cidade e UF ficam preenchidos para a próxima foto.</p>
      </div>
    );
  }

  // ---------------------------------------------------------------- formulário
  const parsedPrice = parsePrice(price);
  const exifDate = photo?.exif.datetime ?? null;
  const dateMismatch = exifDate !== null && recordedAt !== "" && localIsoDate(exifDate) !== recordedAt;
  const canSubmit = photo && !step && parsedPrice > 0 && brand && market.trim() && city.trim() && uf && recordedAt && !pending;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-24 sm:pb-0">
      {/* 1. Foto */}
      <fieldset className="rounded-xl border border-border bg-surface px-4 pb-4 pt-3">
        <legend className="ml-2 px-2 text-sm font-medium text-muted">1. Foto da etiqueta</legend>

        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />

        {!photo && !step && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-stone-300 px-3 py-8 text-sm font-medium hover:border-stone-500"
            >
              <Camera className="size-8 text-accent" aria-hidden />
              Tirar foto
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-stone-300 px-3 py-8 text-sm font-medium hover:border-stone-500"
            >
              <ImagePlus className="size-8 text-muted" aria-hidden />
              Escolher da galeria
            </button>
          </div>
        )}

        {step && (
          <div className="flex items-center gap-3 rounded-xl bg-background p-6 text-sm" role="status">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            {STEP_LABEL[step]}
          </div>
        )}

        {photoError && (
          <p role="alert" className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {photoError}
          </p>
        )}

        {photo && (
          <div className="space-y-3">
            <div className="flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- preview local (blob:) */}
              <img src={photo.previewUrl} alt="Prévia da foto comprimida" className="h-28 w-28 shrink-0 rounded-lg object-cover sm:h-32 sm:w-32" />
              <div className="min-w-0 flex-1 space-y-1.5 text-sm">
                {photo.hasValidExif ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-800">
                    <BadgeCheck className="size-3.5" aria-hidden /> EXIF original encontrado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                    <TriangleAlert className="size-3.5" aria-hidden /> Sem EXIF
                  </span>
                )}
                <p className="flex items-center gap-1.5 text-muted">
                  <Smartphone className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{photo.exif.device ?? "Aparelho desconhecido"}</span>
                </p>
                {exifDate && <p className="text-muted">Capturada em {formatDateTime(exifDate.toISOString())}</p>}
                <p className="flex items-center gap-1.5 font-mono text-[11px] text-subtle" title={photo.sha256}>
                  <Fingerprint className="size-3.5 shrink-0" aria-hidden />
                  {photo.sha256.slice(0, 16)}…
                </p>
                <p className="text-xs text-subtle tabular">
                  {kb(photo.originalBytes)} → {kb(photo.compressedBytes)} · {photo.width}×{photo.height} ·{" "}
                  {photo.compressed.type === "image/webp" ? "webp" : "jpg"}
                </p>
              </div>
            </div>

            {!photo.hasValidExif && (
              <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  Esta foto perdeu os metadados originais da câmera (comum em fotos repassadas por WhatsApp ou capturas de
                  tela). Você pode enviar, mas ela aparecerá como <strong>“Sem EXIF original”</strong> no site. Prefira a
                  foto original do aparelho.
                </span>
              </p>
            )}
            {photo.ageDays !== null && photo.ageDays > 3 && (
              <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                Atenção: a foto foi tirada há {photo.ageDays} dias.
              </p>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={() => cameraRef.current?.click()} className={secondaryButtonClass}>
                <RotateCcw className="size-4" aria-hidden /> Trocar foto
              </button>
              <button type="button" onClick={() => galleryRef.current?.click()} className={secondaryButtonClass}>
                <ImagePlus className="size-4" aria-hidden /> Galeria
              </button>
            </div>
          </div>
        )}
      </fieldset>

      {/* 2. Preço e produto */}
      <fieldset className="flex flex-col gap-4 rounded-xl border border-border bg-surface px-4 pb-4 pt-3" disabled={!photo}>
        <legend className="ml-2 px-2 text-sm font-medium text-muted">2. Preço e produto</legend>

        <div>
          <label htmlFor="price_per_kg" className={labelClass}>
            Preço do <strong>kg</strong> na etiqueta (R$)
          </label>
          <MoneyInput id="price_per_kg" name="price_per_kg" size="lg" required value={price} onValueChange={setPrice} />
          {parsedPrice > 0 && (parsedPrice < 8 || parsedPrice > 60) && (
            <p className="mt-1 text-sm text-amber-800">{formatBRL(parsedPrice)}/kg parece fora do normal. Confira se é o preço do kg.</p>
          )}
        </div>

        <div>
          <span className={labelClass}>Este preço é</span>
          <input type="hidden" name="price_kind" value={priceKind} />
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo de preço">
            {PRICE_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={priceKind === k}
                onClick={() => setPriceKind(k)}
                className={`rounded-lg border px-2 py-3 text-sm font-medium leading-tight ${
                  priceKind === k ? "border-foreground bg-foreground text-white" : "border-border bg-surface hover:border-stone-400"
                }`}
              >
                {k === "clube" ? "Clube" : k === "regular" ? "Normal" : PRICE_KIND_LABEL[k]}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-subtle">
            {priceKind === "regular"
              ? "Preço de gôndola para qualquer cliente. Só esse entra no índice de inflação."
              : priceKind === "oferta"
                ? "Promoção temporária. Aparece no site, mas fica fora do índice."
                : "Preço exclusivo para quem tem cadastro/app do mercado. Aparece no site, mas fica fora do índice."}
          </p>
        </div>

        <div>
          <span className={labelClass}>Marca</span>
          <input type="hidden" name="brand" value={brand} />
          <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-4" role="radiogroup" aria-label="Marca">
            {BRANDS.map((b) => (
              <button
                key={b}
                type="button"
                role="radio"
                aria-checked={brand === b}
                onClick={() => setBrand(b)}
                className={`rounded-lg border px-3 py-3 text-sm font-medium ${
                  brand === b ? "border-foreground bg-foreground text-white" : "border-border bg-surface hover:border-stone-400"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className={labelClass}>Tipo</span>
          <input type="hidden" name="state_type" value={stateType} />
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo">
            {(["resfriado", "congelado"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={stateType === t}
                onClick={() => setStateType(t)}
                className={`rounded-lg border px-3 py-3 text-sm font-medium capitalize ${
                  stateType === t ? "border-foreground bg-foreground text-white" : "border-border bg-surface hover:border-stone-400"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </fieldset>

      {/* 3. Local e data */}
      <fieldset className="flex flex-col gap-4 rounded-xl border border-border bg-surface px-4 pb-4 pt-3" disabled={!photo}>
        <legend className="ml-2 px-2 text-sm font-medium text-muted">3. Local e data</legend>

        <div>
          <label htmlFor="market_name" className={labelClass}>
            Mercado
          </label>
          <input
            id="market_name"
            name="market_name"
            list="market-options"
            autoComplete="off"
            placeholder="Ex.: Supermercado Bom Preço"
            value={market}
            onChange={(e) => handleMarketChange(e.target.value)}
            required
            className={inputClass}
          />
          <datalist id="market-options">
            {markets.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-[1fr_6rem] gap-2">
          <div>
            <label htmlFor="city" className={labelClass}>
              Cidade
            </label>
            <input
              id="city"
              name="city"
              list="city-options"
              autoComplete="off"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className={inputClass}
            />
            <datalist id="city-options">
              {cities.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="state" className={labelClass}>
              UF
            </label>
            <select id="state" name="state" value={uf} onChange={(e) => setUf(e.target.value)} required className={inputClass}>
              <option value="">—</option>
              {UFS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="recorded_at" className={labelClass}>
            Data da coleta {exifDate && !dateMismatch && <span className="font-normal text-emerald-700">· preenchida pelo EXIF</span>}
          </label>
          <input
            id="recorded_at"
            name="recorded_at"
            type="date"
            value={recordedAt}
            onChange={(e) => setRecordedAt(e.target.value)}
            min="2020-01-01"
            required
            className={inputClass}
          />
          {dateMismatch && (
            <p className="mt-1 text-sm text-amber-800">
              Difere da data da foto ({formatDate(localIsoDate(exifDate))}). Confirme se está correta.
            </p>
          )}
        </div>
      </fieldset>

      {result && !result.ok && (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {result.error}
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface/95 p-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0">
        <button type="submit" disabled={!canSubmit} className={primaryButtonClass}>
          {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Send className="size-5" aria-hidden />}
          {pending ? "Enviando…" : "Publicar preço"}
        </button>
      </div>
    </form>
  );
}
