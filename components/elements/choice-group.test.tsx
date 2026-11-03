// @vitest-environment jsdom
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ChoiceGroup } from "@/components/elements/choice-group";

function KindPicker() {
  const [kind, setKind] = useState<"regular" | "oferta" | "clube">("regular");
  return (
    <form aria-label="cadastro">
      <ChoiceGroup label="Tipo de preço" name="price_kind" options={["regular", "oferta", "clube"] as const} labels={{ regular: "Normal" }} value={kind} onChange={setKind} />
    </form>
  );
}

const submittedValue = () => new FormData(screen.getByRole("form", { name: "cadastro" }) as HTMLFormElement).get("price_kind");

describe("ChoiceGroup", () => {
  it("expõe um grupo de rádios acessível, com a opção atual marcada", () => {
    render(<KindPicker />);

    expect(screen.getByRole("radiogroup", { name: "Tipo de preço" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Normal" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("radio", { name: "oferta" }).getAttribute("aria-checked")).toBe("false");
  });

  it("ao clicar, marca a nova opção e envia o valor junto do formulário", async () => {
    render(<KindPicker />);
    expect(submittedValue()).toBe("regular");

    await userEvent.click(screen.getByRole("radio", { name: "clube" }));

    expect(screen.getByRole("radio", { name: "clube" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("radio", { name: "Normal" }).getAttribute("aria-checked")).toBe("false");
    expect(submittedValue()).toBe("clube");
  });

  it("não envia o botão como submit do formulário", async () => {
    let submitted = false;
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted = true;
        }}
      >
        <ChoiceGroup label="Marca" options={["Sadia", "Seara"]} value="Sadia" onChange={() => undefined} />
      </form>,
    );

    await userEvent.click(screen.getByRole("radio", { name: "Seara" }));

    expect(submitted).toBe(false);
  });
});
