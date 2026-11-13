import { describe, expect, it } from "vitest";
import { MAX_SHOWN, nextShownCount, PAGE_SIZE, shownCount } from "@/components/blocks/recent-prices/page-size";

describe("shownCount", () => {
  it("começa com uma página e aceita múltiplos dela", () => {
    expect(shownCount(undefined)).toBe(PAGE_SIZE);
    expect(shownCount("30")).toBe(30);
    expect(shownCount(["20", "90"])).toBe(20);
  });

  it("arredonda para a página seguinte e respeita o teto", () => {
    expect(shownCount("25")).toBe(30);
    expect(shownCount("99999")).toBe(MAX_SHOWN);
  });

  it("valor inválido vindo da URL vira o padrão", () => {
    expect(shownCount("abc")).toBe(PAGE_SIZE);
    expect(shownCount("-50")).toBe(PAGE_SIZE);
    expect(shownCount("0")).toBe(PAGE_SIZE);
  });
});

describe("nextShownCount", () => {
  it("acrescenta uma página enquanto houver mais cadastros", () => {
    expect(nextShownCount(10, 37)).toBe(20);
    expect(nextShownCount(30, 37)).toBe(40);
  });

  it("some quando já está tudo na tela ou no teto", () => {
    expect(nextShownCount(7, 7)).toBeNull();
    expect(nextShownCount(MAX_SHOWN, 500)).toBeNull();
  });
});
