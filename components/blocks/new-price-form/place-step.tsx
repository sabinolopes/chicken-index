import { useMemo } from "react";
import { Field, Select, Suggestions, TextInput } from "@/components/elements/field";
import { FormSection } from "@/components/elements/form-section";
import { formatDate } from "@/lib/format";
import type { MarketSuggestion } from "@/modules/prices/suggestions";
import { UFS } from "@/modules/prices/validation";
import { placeOptions, type PriceFields } from "./form-rules";

interface PlaceStepProps {
  fields: PriceFields;
  setField: <Field extends keyof PriceFields>(field: Field, value: PriceFields[Field]) => void;
  onMarketChange: (market: string) => void;
  suggestions: MarketSuggestion[];
  /** Dia da foto segundo o EXIF (YYYY-MM-DD), ou null sem EXIF. */
  photoDay: string | null;
  dateMismatch: boolean;
  disabled: boolean;
  legend?: string;
}

/** Etapa 3: mercado (com autocompletar que preenche cidade/UF) e data da coleta. */
export function PlaceStep({ fields, setField, onMarketChange, suggestions, photoDay, dateMismatch, disabled, legend = "3. Local e data" }: PlaceStepProps) {
  const { markets, cities } = useMemo(() => placeOptions(suggestions), [suggestions]);
  const filledFromExif = photoDay !== null && !dateMismatch;

  return (
    <FormSection legend={legend} disabled={disabled} className="flex flex-col gap-4">
      <Field htmlFor="market_name" label="Mercado">
        <TextInput
          id="market_name"
          name="market_name"
          list="market-options"
          autoComplete="off"
          placeholder="Ex.: Supermercado Bom Preço"
          value={fields.market}
          onChange={(event) => onMarketChange(event.target.value)}
          required
        />
        <Suggestions id="market-options" options={markets} />
      </Field>

      <div className="grid grid-cols-[1fr_6rem] gap-2">
        <Field htmlFor="city" label="Cidade">
          <TextInput id="city" name="city" list="city-options" autoComplete="off" value={fields.city} onChange={(event) => setField("city", event.target.value)} required />
          <Suggestions id="city-options" options={cities} />
        </Field>
        <Field htmlFor="state" label="UF">
          <Select id="state" name="state" options={UFS} emptyLabel="—" value={fields.uf} onChange={(event) => setField("uf", event.target.value)} required />
        </Field>
      </div>

      <Field
        htmlFor="recorded_at"
        label={<>Data da coleta {filledFromExif && <span className="font-normal text-emerald-700">· preenchida pelo EXIF</span>}</>}
        warning={dateMismatch && photoDay && `Difere da data da foto (${formatDate(photoDay)}). Confirme se está correta.`}
      >
        <TextInput
          id="recorded_at"
          name="recorded_at"
          type="date"
          value={fields.recordedAt}
          onChange={(event) => setField("recordedAt", event.target.value)}
          min="2020-01-01"
          required
        />
      </Field>
    </FormSection>
  );
}
