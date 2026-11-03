import { describe, expect, it } from "vitest";
import { centsFromNumber, formatDate, formatPct, formatShortDate, maskCents } from "@/lib/format";

describe("maskCents", () => {
  it("preenche os dígitos da direita para a esquerda, como uma maquininha", () => {
    expect(maskCents("2")).toBe("0,02");
    expect(maskCents("20")).toBe("0,20");
    expect(maskCents("2000")).toBe("20,00");
    expect(maskCents("2199")).toBe("21,99");
  });

  it("ignora tudo que não é dígito e zeros à esquerda", () => {
    expect(maskCents("R$ 0021,99")).toBe("21,99");
    expect(maskCents("abc")).toBe("");
    expect(maskCents("000")).toBe("");
  });

  it("limita a quantidade de dígitos (preço por kg vai até 999,99)", () => {
    expect(maskCents("1234567")).toBe("123,45");
    expect(maskCents("151800", 8)).toBe("1.518,00");
  });

  it("centsFromNumber gera o valor inicial no mesmo formato da máscara", () => {
    expect(centsFromNumber(1518)).toBe("1.518,00");
    expect(maskCents(centsFromNumber(1518).replace(/\D/g, ""), 8)).toBe("1.518,00");
  });
});

describe("datas e percentuais", () => {
  it("formata datas ISO sem conversão de fuso (31/10 não vira 30/10)", () => {
    expect(formatDate("2026-10-31")).toBe("31/10/2026");
    expect(formatDate("2026-10-31T23:59:00-03:00")).toBe("31/10/2026");
    expect(formatShortDate("2026-01-05")).toBe("05/jan");
    expect(formatShortDate("2026-12-28")).toBe("28/dez");
  });

  it("mostra sinal de + só em alta", () => {
    expect(formatPct(4.25)).toBe("+4,3%");
    expect(formatPct(-2)).toBe("-2,0%");
    expect(formatPct(0)).toBe("0,0%");
    expect(formatPct(4.25, false)).toBe("4,3%");
  });
});
