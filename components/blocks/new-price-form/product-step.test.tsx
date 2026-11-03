// @vitest-environment jsdom
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { EMPTY_FIELDS, type PriceFields } from "@/components/blocks/new-price-form/form-rules";
import { ProductStep } from "@/components/blocks/new-price-form/product-step";

function Harness() {
  const [fields, setFields] = useState<PriceFields>(EMPTY_FIELDS);
  return (
    <form aria-label="cadastro">
      <ProductStep
        fields={fields}
        setField={(field, value) => setFields((current) => ({ ...current, [field]: value }))}
        parsedPrice={0}
        brandSuggestions={["Ki Frango", "Oi Frango"]}
        disabled={false}
      />
    </form>
  );
}

const submittedBrand = () => new FormData(screen.getByRole("form", { name: "cadastro" }) as HTMLFormElement).get("brand");

describe("ProductStep — marca", () => {
  it("só pede o nome da marca quando 'Outra' é escolhida", async () => {
    render(<Harness />);
    expect(screen.queryByLabelText("Qual marca?")).toBeNull();

    await userEvent.click(screen.getByRole("radio", { name: "Seara" }));
    expect(screen.queryByLabelText("Qual marca?")).toBeNull();
    expect(submittedBrand()).toBe("Seara");

    await userEvent.click(screen.getByRole("radio", { name: "Outra" }));
    expect(screen.getByLabelText("Qual marca?")).toBe(document.activeElement);
  });

  it("envia o nome digitado no lugar de 'Outra', já arrumado", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("radio", { name: "Outra" }));

    await userEvent.type(screen.getByLabelText("Qual marca?"), "oi frango");

    expect(submittedBrand()).toBe("Oi Frango");
  });

  it("sugere as marcas já digitadas antes", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("radio", { name: "Outra" }));

    const listId = screen.getByLabelText("Qual marca?").getAttribute("list");
    const options = [...document.querySelectorAll(`#${listId} option`)].map((option) => option.getAttribute("value"));
    expect(options).toEqual(["Ki Frango", "Oi Frango"]);
  });
});
