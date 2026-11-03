import { ChoiceGroup } from "@/components/elements/choice-group";
import { Field } from "@/components/elements/field";
import { FormSection } from "@/components/elements/form-section";
import { MoneyInput } from "@/components/elements/money-input";
import { formatBRL } from "@/lib/format";
import { BRANDS, PRICE_KINDS } from "@/modules/prices/types";
import { PRICE_KIND_HINT, PRICE_KIND_SHORT_LABEL, priceLooksWrong, type PriceFields } from "./form-rules";

const STATE_TYPES = ["resfriado", "congelado"] as const;

interface ProductStepProps {
  fields: PriceFields;
  setField: <Field extends keyof PriceFields>(field: Field, value: PriceFields[Field]) => void;
  parsedPrice: number;
  disabled: boolean;
}

/** Etapa 2: preço do kg, tipo de preço (normal/oferta/clube), marca e resfriado/congelado. */
export function ProductStep({ fields, setField, parsedPrice, disabled }: ProductStepProps) {
  return (
    <FormSection legend="2. Preço e produto" disabled={disabled} className="flex flex-col gap-4">
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
        <ChoiceGroup
          label="Marca"
          name="brand"
          options={BRANDS}
          value={fields.brand as (typeof BRANDS)[number]}
          onChange={(value) => setField("brand", value)}
          className="grid-cols-2 min-[420px]:grid-cols-4"
        />
      </Field>

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
