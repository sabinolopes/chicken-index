// @vitest-environment jsdom
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MoneyInput } from "@/components/elements/money-input";

function PriceField({ maxDigits }: { maxDigits?: number }) {
  const [value, setValue] = useState("");
  return (
    <>
      <label htmlFor="price">Preço</label>
      <MoneyInput id="price" value={value} onValueChange={setValue} maxDigits={maxDigits} />
    </>
  );
}

const field = () => screen.getByLabelText("Preço") as HTMLInputElement;

describe("MoneyInput", () => {
  it("vai empurrando os dígitos da direita para a esquerda enquanto digita", async () => {
    render(<PriceField />);

    await userEvent.type(field(), "2");
    expect(field().value).toBe("0,02");
    await userEvent.type(field(), "1");
    expect(field().value).toBe("0,21");
    await userEvent.type(field(), "99");
    expect(field().value).toBe("21,99");
  });

  it("ignora letras e símbolos e apaga do fim com backspace", async () => {
    render(<PriceField />);

    await userEvent.type(field(), "2a1,9x9");
    expect(field().value).toBe("21,99");
    await userEvent.type(field(), "{Backspace}{Backspace}");
    expect(field().value).toBe("0,21");
  });

  it("respeita o limite de dígitos (salários vão até 999.999,99)", async () => {
    render(<PriceField maxDigits={8} />);

    await userEvent.type(field(), "1621000000");
    expect(field().value).toBe("162.100,00");
  });

  it("abre o teclado numérico no celular", () => {
    render(<PriceField />);
    expect(field().inputMode).toBe("numeric");
  });
});
