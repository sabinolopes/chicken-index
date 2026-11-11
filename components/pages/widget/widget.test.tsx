// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Widget } from "@/components/pages/widget";

const preview = {
  price: "R$ 21,22",
  week: "Semana de 09/nov",
  change: { text: "+2,5% desde 02/nov", tone: "up" as const },
  wage: "1 salário mínimo compra 76,4 kg",
};

describe("Widget", () => {
  it("mostra preço, variação e poder de compra", () => {
    render(<Widget preview={preview} />);

    expect(screen.getByText("R$ 21,22")).toBeTruthy();
    expect(screen.getByText(/\+2,5% desde 02\/nov/)).toBeTruthy();
    expect(screen.getByText("1 salário mínimo compra 76,4 kg")).toBeTruthy();
  });

  it("abre o Frangômetro numa aba nova, fora do iframe do site parceiro", () => {
    render(<Widget preview={preview} />);

    const link = screen.getByRole("link", { name: /Ver as fotos das etiquetas/ });
    expect([link.getAttribute("href"), link.getAttribute("target")]).toEqual(["/", "_blank"]);
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("sem preços publicados, avisa em vez de mostrar número", () => {
    render(<Widget preview={null} />);
    expect(screen.getByText("Ainda não há preços publicados.")).toBeTruthy();
    expect(screen.queryByText(/R\$/)).toBeNull();
  });
});
