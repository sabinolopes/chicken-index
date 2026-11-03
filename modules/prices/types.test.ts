import { describe, expect, it } from "vitest";
import { brandGroup, normalizeBrand } from "@/modules/prices/types";

describe("normalizeBrand", () => {
  it("dá iniciais maiúsculas à marca digitada toda em minúsculas", () => {
    expect(normalizeBrand("oi frango")).toBe("Oi Frango");
    expect(normalizeBrand("  ki   frango ")).toBe("Ki Frango");
    expect(normalizeBrand("água branca")).toBe("Água Branca");
  });

  it("respeita a grafia de quem já digitou com maiúsculas (siglas, nomes próprios)", () => {
    expect(normalizeBrand("BRF Frangos")).toBe("BRF Frangos");
    expect(normalizeBrand("da Granja")).toBe("da Granja");
  });

  it("usa a grafia oficial das marcas principais, mesmo digitadas em 'Outra'", () => {
    expect(normalizeBrand("sadia")).toBe("Sadia");
    expect(normalizeBrand("PERDIGAO")).toBe("Perdigão");
  });

  it("corta em 40 caracteres", () => {
    expect(normalizeBrand("a".repeat(60))).toHaveLength(40);
  });
});

describe("brandGroup", () => {
  it("marcas principais têm grupo próprio; as demais entram em 'Outra'", () => {
    expect(brandGroup("Seara")).toBe("Seara");
    expect(brandGroup("Oi Frango")).toBe("Outra");
    expect(brandGroup("Outra")).toBe("Outra");
  });
});
