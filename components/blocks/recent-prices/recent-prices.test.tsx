// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecentPrices } from "@/components/blocks/recent-prices";
import { deletePrice } from "@/modules/prices/actions";
import type { ChickenPrice } from "@/modules/prices/types";

vi.mock("@/modules/prices/actions", () => ({ deletePrice: vi.fn(), updatePrice: vi.fn() }));

const price = (index: number): ChickenPrice => ({
  id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
  brand: "Seara",
  state_type: "congelado",
  price_kind: "regular",
  price_per_kg: 16.98,
  market_name: `Mercado ${index}`,
  city: "Itaperuna",
  state: "RJ",
  recorded_at: "2026-11-10",
  photo_url: "https://pub-teste.r2.dev/foto.webp",
  original_sha256: String(index).padStart(64, "0"),
  exif_device: null,
  exif_datetime: null,
  has_valid_exif: true,
  created_at: "2026-11-10T12:00:00Z",
  updated_at: null,
});

const suggestions = { markets: [], brands: [] };
const prices = (count: number) => Array.from({ length: count }, (_, index) => price(index + 1));

describe("RecentPrices", () => {
  it("com mais cadastros no banco, oferece a próxima página pela URL", () => {
    render(<RecentPrices prices={prices(10)} total={37} suggestions={suggestions} />);

    expect(screen.getByText("Mostrando 10 de 37")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Mostrar mais 10" }).getAttribute("href")).toBe("/admin?mostrar=20");
  });

  it("na última página, oferece só o que falta e depois some", () => {
    const { rerender } = render(<RecentPrices prices={prices(30)} total={37} suggestions={suggestions} />);
    expect(screen.getByRole("link", { name: "Mostrar mais 7" }).getAttribute("href")).toBe("/admin?mostrar=40");

    rerender(<RecentPrices prices={prices(7)} total={7} suggestions={suggestions} />);
    expect(screen.getByText("Mostrando 7 de 7")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Mostrar mais/ })).toBeNull();
  });
});

describe("RecentPrices — exclusão", () => {
  const deleteMock = vi.mocked(deletePrice);
  beforeEach(() => {
    deleteMock.mockReset();
    // Como no navegador embutido do WhatsApp: a janela do confirm() nunca aparece e a resposta é "cancelar".
    vi.spyOn(window, "confirm").mockReturnValue(false);
  });

  it("confirma na própria linha e exclui, mesmo onde o confirm() do navegador não funciona", async () => {
    deleteMock.mockResolvedValue({ ok: true, message: "Registro excluído." });
    render(<RecentPrices prices={prices(2)} total={2} suggestions={suggestions} />);

    await userEvent.click(screen.getByRole("button", { name: "Excluir registro de Mercado 2" }));
    const confirmation = screen.getByRole("group", { name: "Confirmar exclusão" });
    expect(confirmation.textContent).toContain("Mercado 2");
    await userEvent.click(within(confirmation).getByRole("button", { name: "Excluir" }));

    expect(deleteMock).toHaveBeenCalledWith(price(2).id);
    expect(window.confirm).not.toHaveBeenCalled();
  });

  it("'Cancelar' fecha a confirmação sem excluir", async () => {
    render(<RecentPrices prices={prices(1)} total={1} suggestions={suggestions} />);

    await userEvent.click(screen.getByRole("button", { name: "Excluir registro de Mercado 1" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("group", { name: "Confirmar exclusão" })).toBeNull();
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("mostra o motivo quando o servidor não exclui", async () => {
    deleteMock.mockResolvedValue({ ok: false, error: "O banco não excluiu o registro (sem permissão ou já excluído). Entre de novo e tente outra vez." });
    render(<RecentPrices prices={prices(1)} total={1} suggestions={suggestions} />);

    await userEvent.click(screen.getByRole("button", { name: "Excluir registro de Mercado 1" }));
    await userEvent.click(within(screen.getByRole("group", { name: "Confirmar exclusão" })).getByRole("button", { name: "Excluir" }));

    expect(await screen.findByText(/O banco não excluiu o registro/)).toBeTruthy();
  });
});
