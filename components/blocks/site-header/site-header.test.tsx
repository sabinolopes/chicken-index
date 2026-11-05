// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteHeader } from "@/components/blocks/site-header";

describe("SiteHeader", () => {
  it("leva para o início e para Como medimos, com a ação da página ao lado do menu", () => {
    render(<SiteHeader action={<button type="button">Gerar resumo</button>} />);

    expect(screen.getByRole("link", { name: "Frangômetro" }).getAttribute("href")).toBe("/");
    const menu = screen.getByRole("navigation", { name: "Menu" });
    expect(within(menu).getByRole("link", { name: "Como medimos" }).getAttribute("href")).toBe("/como-medimos");
    expect(within(menu).getByRole("button", { name: "Gerar resumo" })).toBeTruthy();
  });

  it("marca o item da página atual para leitores de tela", () => {
    const { rerender } = render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "Como medimos" }).getAttribute("aria-current")).toBeNull();

    rerender(<SiteHeader current="como-medimos" />);
    expect(screen.getByRole("link", { name: "Como medimos" }).getAttribute("aria-current")).toBe("page");
  });
});
