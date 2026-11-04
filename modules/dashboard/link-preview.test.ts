import { describe, expect, it } from "vitest";
import { linkPreview } from "@/modules/dashboard/link-preview";
import type { Kpis } from "@/modules/dashboard/stats";

const kpis = {
  currentAvg: 19.69,
  firstAvg: 18.5,
  accumulatedPct: 6.43,
  weeklyPct: 1.2,
  comparedProducts: 4,
  firstWeek: "2026-11-02",
  currentWeek: "2026-11-30",
  weeks: 5,
  records: 20,
  audited: 18,
  promoCount: 2,
  minWageKg: { start: 87.6, now: 82.3, deltaPct: -6 },
  avgWageKg: { start: 212.5, now: 199.7, deltaPct: -6 },
} satisfies Kpis;

describe("linkPreview", () => {
  it("resume preço, variação no índice e poder de compra para a prévia do link", () => {
    expect(linkPreview(kpis)).toEqual({
      price: "R$ 19,69", // Intl separa "R$" com espaço não separável
      week: "Semana de 30/nov",
      change: { text: "+6,4% desde 02/nov", tone: "up" },
      wage: "1 salário mínimo compra 82,3 kg",
    });
  });

  it("queda aparece como boa notícia e variação mínima como estável", () => {
    expect(linkPreview({ ...kpis, accumulatedPct: -3 })?.change?.tone).toBe("down");
    expect(linkPreview({ ...kpis, accumulatedPct: 0.01 })?.change?.tone).toBe("stable");
  });

  it("com uma semana só, não mostra variação (ainda não há o que comparar)", () => {
    expect(linkPreview({ ...kpis, weeks: 1 })?.change).toBeNull();
  });

  it("sem preços, devolve null para a imagem mostrar só a proposta do site", () => {
    expect(linkPreview(null)).toBeNull();
  });
});
