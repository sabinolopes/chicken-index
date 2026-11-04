// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EditPriceDialog } from "@/components/blocks/edit-price";
import { updatePrice } from "@/modules/prices/actions";
import type { ChickenPrice } from "@/modules/prices/types";

vi.mock("@/modules/prices/actions", () => ({ updatePrice: vi.fn() }));

const price: ChickenPrice = {
  id: "3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c",
  brand: "Oi Frango",
  state_type: "congelado",
  price_kind: "regular",
  price_per_kg: 19.39,
  market_name: "Lizeu",
  city: "Itaperuna",
  state: "RJ",
  recorded_at: "2026-11-04",
  photo_url: "https://pub-teste.r2.dev/2026-11/foto.webp",
  original_sha256: "ab".repeat(32),
  exif_device: null,
  exif_datetime: null,
  has_valid_exif: false,
  created_at: "2026-11-04T15:10:00.000Z",
  updated_at: null,
};

const suggestions = { markets: [], brands: ["Oi Frango"] };
const updatePriceMock = vi.mocked(updatePrice);

async function fixPrice(digits: string) {
  const input = screen.getByLabelText(/Preço do/);
  await userEvent.clear(input);
  await userEvent.type(input, digits);
  await userEvent.click(screen.getByRole("button", { name: "Salvar correção" }));
}

describe("EditPriceDialog", () => {
  beforeEach(() => updatePriceMock.mockReset());

  it("abre com os dados atuais e a foto da etiqueta para conferir", () => {
    render(<EditPriceDialog price={price} suggestions={suggestions} onClose={() => undefined} />);

    expect(screen.getByRole("dialog", { name: "Corrigir cadastro" })).toBeTruthy();
    expect((screen.getByLabelText(/Preço do/) as HTMLInputElement).value).toBe("19,39");
    expect((screen.getByLabelText("Qual marca?") as HTMLInputElement).value).toBe("Oi Frango");
    expect(screen.getByRole("img", { name: "Etiqueta fotografada em Lizeu" }).getAttribute("src")).toBe(price.photo_url);
  });

  it("envia a correção do registro certo e fecha ao salvar", async () => {
    updatePriceMock.mockResolvedValue({ ok: true, message: "Cadastro corrigido." });
    const onClose = vi.fn();
    render(<EditPriceDialog price={price} suggestions={suggestions} onClose={onClose} />);

    await fixPrice("1969");

    const [id, form] = updatePriceMock.mock.calls[0];
    expect(id).toBe(price.id);
    expect([form.get("price_per_kg"), form.get("brand"), form.get("market_name"), form.get("recorded_at")]).toEqual([
      "19,69",
      "Oi Frango",
      "Lizeu",
      "2026-11-04",
    ]);
    expect(onClose).toHaveBeenCalled();
  });

  it("mostra o erro do servidor e continua aberto", async () => {
    updatePriceMock.mockResolvedValue({ ok: false, error: "Registro não encontrado." });
    const onClose = vi.fn();
    render(<EditPriceDialog price={price} suggestions={suggestions} onClose={onClose} />);

    await fixPrice("1969");

    expect(await screen.findByText("Registro não encontrado.")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });
});
