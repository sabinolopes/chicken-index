// @vitest-environment jsdom
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { EMPTY_FIELDS, type PriceFields } from "@/components/blocks/new-price-form/form-rules";
import { PlaceStep } from "@/components/blocks/new-price-form/place-step";
import type { MarketSuggestion } from "@/modules/prices/suggestions";

const KNOWN: MarketSuggestion[] = [
  { market_name: "Unidos", city: "Itaperuna", state: "RJ" },
  { market_name: "Assaí", city: "Campos dos Goytacazes", state: "RJ" },
];

function Harness({ suggestions = KNOWN }: { suggestions?: MarketSuggestion[] }) {
  const [fields, setFields] = useState<PriceFields>(EMPTY_FIELDS);
  const changeMarket = (market: string) => {
    const known = suggestions.find((suggestion) => suggestion.market_name === market);
    setFields((current) => ({ ...current, market, ...(known && { city: known.city, uf: known.state }) }));
  };
  return (
    <form aria-label="cadastro">
      <PlaceStep
        fields={fields}
        setField={(field, value) => setFields((current) => ({ ...current, [field]: value }))}
        onMarketChange={changeMarket}
        suggestions={suggestions}
        photoDay={null}
        dateMismatch={false}
        disabled={false}
      />
    </form>
  );
}

const submitted = (field: string) => new FormData(screen.getByRole("form", { name: "cadastro" }) as HTMLFormElement).get(field);

describe("PlaceStep — mercado", () => {
  it("lista os mercados já cadastrados em ordem e, no fim, a opção de digitar um novo", () => {
    render(<Harness />);

    const options = [...(screen.getByLabelText("Mercado") as HTMLSelectElement).options].map((option) => option.text);
    expect(options).toEqual(["Selecione o mercado", "Assaí", "Unidos", "Outro mercado (digitar)"]);
    expect(screen.queryByLabelText("Nome do mercado novo")).toBeNull();
  });

  it("escolher um mercado da lista envia o nome e preenche cidade e UF", async () => {
    render(<Harness />);

    await userEvent.selectOptions(screen.getByLabelText("Mercado"), "Assaí");

    expect(submitted("market_name")).toBe("Assaí");
    expect([submitted("city"), submitted("state")]).toEqual(["Campos dos Goytacazes", "RJ"]);
  });

  it("'Outro mercado' abre o campo e envia o nome digitado", async () => {
    render(<Harness />);

    await userEvent.selectOptions(screen.getByLabelText("Mercado"), "Outro mercado (digitar)");
    const input = screen.getByLabelText("Nome do mercado novo");
    expect(input).toBe(document.activeElement);
    await userEvent.type(input, "Supermercado Lizeu");

    expect(submitted("market_name")).toBe("Supermercado Lizeu");
  });

  it("sem nenhum mercado cadastrado ainda, mostra direto o campo de texto", () => {
    render(<Harness suggestions={[]} />);

    expect(screen.getByLabelText("Mercado").tagName).toBe("INPUT");
  });
});
