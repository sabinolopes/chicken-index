import { ChoiceGroup } from "@/components/elements/choice-group";
import { Field, Suggestions, TextInput } from "@/components/elements/field";
import { FormSection } from "@/components/elements/form-section";
import { MoneyInput } from "@/components/elements/money-input";
import { formatBRL } from "@/lib/format";
import { BRANDS, OTHER_BRAND, PRICE_KINDS } from "@/modules/prices/types";
import { PRICE_KIND_HINT, PRICE_KIND_SHORT_LABEL, priceLooksWrong, resolvedBrand, type PriceFields } from "./form-rules";

const STATE_TYPES = ["resfriado", "congelado"] as const;

interface ProductStepProps {
  fields: PriceFields;
  setField: <Field extends keyof PriceFields>(field: Field, value: PriceFields[Field]) => void;
  parsedPrice: number;
  /** Marcas digitadas em cadastros anteriores, para não surgir "Oi Frango" e "oi frango" separados. */
  brandSuggestions: string[];
  disabled: boolean;
  legend?: string;
  /** Leva o foco ao campo "Qual marca?" quando ele aparece (no cadastro; na correção, abriria o teclado sozinho). */
  focusOtherBrand?: boolean;
}

/** Etapa 2: preço do kg, tipo de preço (normal/oferta/clube), marca e resfriado/congelado. */
export function ProductStep({ fields, setField, parsedPrice, brandSuggestions, disabled, legend = "2. Preço e produto", focusOtherBrand = true }: ProductStepProps) {
  return (
    <FormSection legend={legend} disabled={disabled} className="flex flex-col gap-4">
      <Field
        htmlFor="price_per_kg"
        label={
          <>
            Preço do <strong>kg</strong> na etiqueta (R$)
          </>
        }
        warning={priceLooksWrong(parsedPrice) && `${formatBRL(parsedPrice)}/kg parece fora do normal. Confira se é o preço do kg.`}
      >
        <MoneyInput id="price_per_kg" name="price_per_kg" size="lg" required value={fields.price} onValueChange={(value) => setField("price", value)} />
      </Field>

      <Field label="Este preço é" hint={PRICE_KIND_HINT[fields.priceKind]}>
        <ChoiceGroup
          label="Tipo de preço"
          name="price_kind"
          options={PRICE_KINDS}
          labels={PRICE_KIND_SHORT_LABEL}
          value={fields.priceKind}
          onChange={(value) => setField("priceKind", value)}
          className="grid-cols-3"
          optionClassName="px-2 leading-tight"
        />
      </Field>

      <Field label="Marca">
        <input type="hidden" name="brand" value={resolvedBrand(fields)} />
        <ChoiceGroup
          label="Marca"
          options={BRANDS}
          value={fields.brand as (typeof BRANDS)[number]}
          onChange={(value) => setField("brand", value)}
          className="grid-cols-3"
        />
      </Field>

      {fields.brand === OTHER_BRAND && (
        <Field htmlFor="other-brand" label="Qual marca?" hint="Ex.: Oi Frango, Ki Frango, marca do próprio mercado.">
          <TextInput
            id="other-brand"
            list="brand-options"
            autoComplete="off"
            autoFocus={focusOtherBrand}
            required
            maxLength={40}
            value={fields.otherBrand}
            onChange={(event) => setField("otherBrand", event.target.value)}
          />
          <Suggestions id="brand-options" options={brandSuggestions} />
        </Field>
      )}

      <Field label="Tipo">
        <ChoiceGroup
          label="Tipo"
          name="state_type"
          options={STATE_TYPES}
          value={fields.stateType}
          onChange={(value) => setField("stateType", value)}
          className="grid-cols-2"
          optionClassName="capitalize"
        />
      </Field>
    </FormSection>
  );
}
