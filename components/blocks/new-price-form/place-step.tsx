import { useMemo } from "react";
import { Field, Select, Suggestions, TextInput } from "@/components/elements/field";
import { FormSection } from "@/components/elements/form-section";
import { formatDate } from "@/lib/format";
import type { MarketSuggestion } from "@/modules/prices/suggestions";
import { UFS } from "@/modules/prices/validation";
import { marketChoices, NEW_MARKET, placeOptions, type PriceFields } from "./form-rules";

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

/** Etapa 3: mercado (da lista, que preenche cidade/UF, ou digitado se for novo) e data da coleta. */
export function PlaceStep({ fields, setField, onMarketChange, suggestions, photoDay, dateMismatch, disabled, legend = "3. Local e data" }: PlaceStepProps) {
  const { markets, cities } = useMemo(() => placeOptions(suggestions), [suggestions]);
  const filledFromExif = photoDay !== null && !dateMismatch;

  return (
    <FormSection legend={legend} disabled={disabled} className="flex flex-col gap-4">
      <MarketField fields={fields} setField={setField} onMarketChange={onMarketChange} known={markets} />

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

interface MarketFieldProps extends Pick<PlaceStepProps, "fields" | "setField" | "onMarketChange"> {
  known: string[];
}

/**
 * Mercado escolhido na lista dos já cadastrados (o mesmo nome toda semana é o que deixa o
 * índice comparar o mercado com ele mesmo). "Outro mercado" abre o campo para digitar.
 * Sem nenhum mercado cadastrado ainda, só o campo de texto.
 */
function MarketField({ fields, setField, onMarketChange, known }: MarketFieldProps) {
  const choices = useMemo(() => marketChoices(known, fields.newMarket ? "" : fields.market), [known, fields.newMarket, fields.market]);
  const hasList = choices.length > 0;

  function choose(value: string) {
    setField("newMarket", value === NEW_MARKET);
    if (value === NEW_MARKET) {
      setField("market", "");
      return;
    }
    onMarketChange(value);
  }

  return (
    <>
      <input type="hidden" name="market_name" value={fields.market} />
      {hasList && (
        <Field htmlFor="market_choice" label="Mercado">
          <Select
            id="market_choice"
            options={[...choices, NEW_MARKET]}
            labels={{ [NEW_MARKET]: "Outro mercado (digitar)" }}
            emptyLabel="Selecione o mercado"
            value={fields.newMarket ? NEW_MARKET : fields.market}
            onChange={(event) => choose(event.target.value)}
            required
          />
        </Field>
      )}
      {(fields.newMarket || !hasList) && (
        <Field htmlFor="market_name" label={hasList ? "Nome do mercado novo" : "Mercado"} hint={hasList ? "Confira se ele já não está na lista com outro nome." : undefined}>
          <TextInput
            id="market_name"
            autoComplete="off"
            autoFocus={hasList}
            placeholder="Ex.: Supermercado Bom Preço"
            maxLength={80}
            value={fields.market}
            onChange={(event) => setField("market", event.target.value)}
            required
          />
        </Field>
      )}
    </>
  );
}
