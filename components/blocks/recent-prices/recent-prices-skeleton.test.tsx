// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RecentPricesSkeleton } from "@/components/blocks/recent-prices";

describe("RecentPricesSkeleton", () => {
  it("avisa o leitor de tela que está carregando, sem ler os blocos cinza", () => {
    render(<RecentPricesSkeleton />);

    const region = screen.getByRole("status");
    expect(region.getAttribute("aria-busy")).toBe("true");
    expect(region.textContent).toBe("Carregando últimos cadastros…");
  });

  it("tem o formato da lista real (linhas com miniatura), para a página não pular quando os dados chegam", () => {
    const { container } = render(<RecentPricesSkeleton />);
    expect(container.querySelectorAll("li")).toHaveLength(4);
    expect(container.querySelectorAll("li .size-12")).toHaveLength(4);
  });
});
