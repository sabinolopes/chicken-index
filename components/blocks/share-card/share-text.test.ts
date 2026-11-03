import { describe, expect, it } from "vitest";
import { shareText } from "@/components/blocks/share-card/share-text";
import type { Kpis } from "@/modules/dashboard/stats";

const kpis = {
  currentAvg: 25,
  accumulatedPct: 25,
  firstWeek: "2026-11-02",
  minWageKg: { start: 75, now: 60, deltaPct: -20 },
  avgWageKg: { start: 150, now: 120, deltaPct: -20 },
} as Kpis;

describe("shareText", () => {
  it("resume preço, variação e poder de compra, com o link para conferir as fotos", () => {
    const text = shareText({ kpis, filterLabel: "Sadia · Itaperuna", site: "frangometro.vercel.app" });

    expect(text.split("\n")).toEqual([
      "🐔 *Frangômetro*: preço do peito de frango — Sadia · Itaperuna",
      "Preço médio do kg (sem promoções): *R$ 25,00* (+25,0% desde 02/nov)",
      "Salário mínimo comprava 75,0 kg, hoje compra 60,0 kg.",
      "Salário médio comprava 150,0 kg, hoje compra 120,0 kg.",
      "Fotos auditadas com EXIF + SHA-256.",
      "Veja as fotos das etiquetas: https://frangometro.vercel.app",
    ]);
  });

  it("sem recorte nem endereço, não deixa travessão nem link vazio", () => {
    const text = shareText({ kpis, filterLabel: "", site: "" });
    expect(text.split("\n")[0]).toBe("🐔 *Frangômetro*: preço do peito de frango");
    expect(text).not.toContain("https://");
  });
});
