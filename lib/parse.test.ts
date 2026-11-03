import { describe, expect, it } from "vitest";
import { parsePrice, todayInBrazil } from "@/lib/parse";

describe("parsePrice", () => {
  it("aceita vírgula, ponto e o formato da máscara com milhar", () => {
    expect(parsePrice("21,99")).toBe(21.99);
    expect(parsePrice("21.99")).toBe(21.99);
    expect(parsePrice("R$ 1.621,00")).toBe(1621);
    expect(parsePrice("1.518")).toBe(1518);
  });

  it("devolve NaN quando não há número", () => {
    expect(parsePrice("")).toBeNaN();
    expect(parsePrice("R$")).toBeNaN();
  });
});

describe("todayInBrazil", () => {
  it("usa o fuso de Brasília: 23h de 02/11 em São Paulo ainda é dia 02", () => {
    expect(todayInBrazil(new Date("2026-11-03T02:00:00Z"))).toBe("2026-11-02");
    expect(todayInBrazil(new Date("2026-11-03T03:00:00Z"))).toBe("2026-11-03");
  });
});
