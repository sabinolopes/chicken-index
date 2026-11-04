// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Gallery, GALLERY_PAGE_SIZE } from "@/components/blocks/gallery";
import type { ChickenPrice } from "@/modules/prices/types";

function price(index: number, overrides: Partial<ChickenPrice> = {}): ChickenPrice {
  return {
    id: `price-${index}`,
    brand: "Sadia",
    state_type: "resfriado",
    price_kind: "regular",
    price_per_kg: 20 + index / 100,
    market_name: `Mercado ${index}`,
    city: "Itaperuna",
    state: "RJ",
    recorded_at: "2026-11-02",
    photo_url: `https://pub-teste.r2.dev/2026-11/${String(index).padStart(64, "0")}.webp`,
    original_sha256: String(index).padStart(64, "0"),
    exif_device: "Apple iPhone 13",
    exif_datetime: "2026-11-02T14:00:00.000Z",
    has_valid_exif: true,
    created_at: "2026-11-02T15:00:00.000Z",
    updated_at: null,
    ...overrides,
  };
}

const prices = (count: number) => Array.from({ length: count }, (_, index) => price(index + 1));
const cards = () => within(screen.getByRole("list")).getAllByRole("listitem");

describe("Gallery", () => {
  it("mostra 12 fotos por vez e carrega mais sob demanda", async () => {
    render(<Gallery prices={prices(30)} />);
    expect(cards()).toHaveLength(GALLERY_PAGE_SIZE);
    expect(screen.getByText("12 de 30")).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
    expect(cards()).toHaveLength(24);

    await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
    expect(cards()).toHaveLength(30);
    expect(screen.queryByRole("button", { name: "Carregar mais" })).toBeNull();
  });

  it("as fotos carregam só quando chegam perto da tela (lazy)", () => {
    render(<Gallery prices={prices(3)} />);
    const images = screen.getAllByRole("img");
    expect(images.every((image) => image.getAttribute("loading") === "lazy")).toBe(true);
  });

  it("marca promoções e fotos sem EXIF no próprio cartão", () => {
    render(<Gallery prices={[price(1, { price_kind: "clube", has_valid_exif: false })]} />);
    expect(screen.getByText("Clube de desconto")).toBeTruthy();
    expect(screen.getByText("Sem EXIF original · SHA256")).toBeTruthy();
  });

  it("abre a prova com o hash completo e fecha no Esc", async () => {
    const audited = price(7);
    render(<Gallery prices={[audited]} />);

    await userEvent.click(screen.getByRole("button", { name: /Etiqueta Sadia/ }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(audited.original_sha256)).toBeTruthy();
    expect(within(dialog).getByText("Apple iPhone 13")).toBeTruthy();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("explica quando o filtro não tem fotos", () => {
    render(<Gallery prices={[]} />);
    expect(screen.getByText("Nenhuma foto para os filtros selecionados.")).toBeTruthy();
  });
});
