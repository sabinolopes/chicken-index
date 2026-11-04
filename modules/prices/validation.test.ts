import { describe, expect, it } from "vitest";
import { isPriceId, MAX_PHOTO_BYTES, parsePhotoFile, parsePriceDetails, parsePriceForm } from "@/modules/prices/validation";

const SHA = "a".repeat(64);

/** Formulário válido de cadastro; cada teste muda só o campo que interessa. */
function priceForm(overrides: Record<string, string> = {}) {
  const fields = {
    brand: "Sadia",
    state_type: "resfriado",
    price_kind: "regular",
    price_per_kg: "21,99",
    market_name: "  Supermercado   Unidos ",
    city: "Itaperuna",
    state: "rj",
    recorded_at: "2026-10-30",
    original_sha256: SHA.toUpperCase(),
    exif_device: "Apple iPhone 13",
    exif_datetime: "2026-10-30T14:20:00.000Z",
    has_valid_exif: "true",
    ...overrides,
  };
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  return form;
}

const errorOf = (overrides: Record<string, string>) => {
  const result = parsePriceForm(priceForm(overrides));
  return "error" in result ? result.error : null;
};

describe("parsePriceForm", () => {
  it("normaliza um cadastro válido para o formato do banco", () => {
    const result = parsePriceForm(priceForm());
    expect(result).toEqual({
      data: {
        brand: "Sadia",
        state_type: "resfriado",
        price_kind: "regular",
        price_per_kg: 21.99,
        market_name: "Supermercado Unidos",
        city: "Itaperuna",
        state: "RJ",
        recorded_at: "2026-10-30",
        original_sha256: SHA,
        exif_device: "Apple iPhone 13",
        exif_datetime: "2026-10-30T14:20:00.000Z",
        has_valid_exif: true,
      },
    });
  });

  it("descarta aparelho e data da câmera quando a foto não tem EXIF válido", () => {
    const result = parsePriceForm(priceForm({ has_valid_exif: "false" }));
    expect(result).toMatchObject({ data: { exif_device: null, exif_datetime: null, has_valid_exif: false } });
  });

  it("não marca como auditada uma foto sem data EXIF, mesmo se o cliente disser que sim", () => {
    const result = parsePriceForm(priceForm({ exif_datetime: "" }));
    expect(result).toMatchObject({ data: { has_valid_exif: false } });
  });

  it("aceita oferta e clube e assume preço normal quando o campo falta", () => {
    expect(parsePriceForm(priceForm({ price_kind: "clube" }))).toMatchObject({ data: { price_kind: "clube" } });
    expect(parsePriceForm(priceForm({ price_kind: "" }))).toMatchObject({ data: { price_kind: "regular" } });
  });

  it("recusa cada campo inválido com a mensagem do campo", () => {
    expect(errorOf({ brand: "" })).toBe("Selecione a marca.");
    expect(errorOf({ brand: "Outra" })).toBe("Digite qual é a marca.");
    expect(errorOf({ brand: "x" })).toBe("Nome da marca muito curto.");
    expect(errorOf({ state_type: "assado" })).toBe("Selecione resfriado ou congelado.");
    expect(errorOf({ price_kind: "black-friday" })).toBe("Tipo de preço inválido.");
    expect(errorOf({ price_per_kg: "0,50" })).toBe("Preço por kg inválido (ex.: 21,99).");
    expect(errorOf({ price_per_kg: "600,00" })).toBe("Preço por kg inválido (ex.: 21,99).");
    expect(errorOf({ market_name: "   " })).toBe("Informe o mercado.");
    expect(errorOf({ city: "" })).toBe("Informe a cidade.");
    expect(errorOf({ state: "XX" })).toBe("Selecione o estado (UF).");
    expect(errorOf({ original_sha256: "123" })).toBe("Hash SHA-256 ausente ou inválido. Selecione a foto novamente.");
    expect(errorOf({ exif_datetime: "ontem" })).toBe("Data EXIF inválida.");
  });

  it("recusa data no futuro, antes de 2020 ou fora do formato", () => {
    const message = "Data da coleta inválida (não pode ser no futuro).";
    expect(errorOf({ recorded_at: "2999-01-01" })).toBe(message);
    expect(errorOf({ recorded_at: "2019-12-31" })).toBe(message);
    expect(errorOf({ recorded_at: "30/10/2026" })).toBe(message);
  });

  it("aponta o primeiro erro na ordem do formulário", () => {
    expect(errorOf({ brand: "", city: "" })).toBe("Selecione a marca.");
  });

  it("corta textos longos para não gravar lixo no banco", () => {
    const result = parsePriceForm(priceForm({ market_name: "M".repeat(500) }));
    expect(result).toMatchObject({ data: { market_name: "M".repeat(80) } });
  });
});

describe("marca digitada em 'Outra'", () => {
  it("aceita qualquer marca e grava o nome arrumado", () => {
    expect(parsePriceForm(priceForm({ brand: "  oi   frango " }))).toMatchObject({ data: { brand: "Oi Frango" } });
    expect(parsePriceForm(priceForm({ brand: "Ki Frango" }))).toMatchObject({ data: { brand: "Ki Frango" } });
  });

  it("marca principal digitada vira a grafia oficial (não cria 'sadia' separada de 'Sadia')", () => {
    expect(parsePriceForm(priceForm({ brand: "SADIA" }))).toMatchObject({ data: { brand: "Sadia" } });
  });
});

describe("parsePhotoFile", () => {
  const photo = (bytes: number, type: string) => new File([new Uint8Array(bytes)], "etiqueta", { type });

  it("aceita a foto comprimida em webp ou jpeg", () => {
    const file = photo(150 * 1024, "image/webp");
    expect(parsePhotoFile(file)).toEqual({ file });
    expect(parsePhotoFile(photo(10, "image/jpeg"))).toHaveProperty("file");
  });

  it("recusa campo vazio, texto no lugar do arquivo, outro formato ou arquivo grande demais", () => {
    expect(parsePhotoFile(null)).toEqual({ error: "Foto comprimida ausente." });
    expect(parsePhotoFile("foto.webp")).toEqual({ error: "Foto comprimida ausente." });
    expect(parsePhotoFile(photo(0, "image/webp"))).toEqual({ error: "Foto comprimida ausente." });
    expect(parsePhotoFile(photo(10, "image/png"))).toEqual({ error: "A foto deve estar em .webp ou .jpg." });
    expect(parsePhotoFile(photo(MAX_PHOTO_BYTES + 1, "image/webp"))).toEqual({ error: "Foto comprimida maior que 1 MB." });
  });
});

describe("parsePriceDetails (correção de um cadastro)", () => {
  it("lê só os dados da etiqueta, com as mesmas regras do cadastro", () => {
    const form = priceForm({ price_per_kg: "19,69", brand: "pif paf" });
    form.delete("original_sha256");
    form.delete("exif_datetime");

    expect(parsePriceDetails(form)).toEqual({
      data: {
        brand: "Pif Paf",
        state_type: "resfriado",
        price_kind: "regular",
        price_per_kg: 19.69,
        market_name: "Supermercado Unidos",
        city: "Itaperuna",
        state: "RJ",
        recorded_at: "2026-10-30",
      },
    });
  });

  it("nunca devolve hash nem EXIF, mesmo que o navegador mande", () => {
    const result = parsePriceDetails(priceForm({ has_valid_exif: "true" }));
    expect(Object.keys("data" in result ? result.data : {})).not.toContain("original_sha256");
    expect(Object.keys("data" in result ? result.data : {})).not.toContain("has_valid_exif");
  });

  it("recusa preço ou data inválidos como no cadastro", () => {
    expect(parsePriceDetails(priceForm({ price_per_kg: "0,50" }))).toEqual({ error: "Preço por kg inválido (ex.: 21,99)." });
    expect(parsePriceDetails(priceForm({ recorded_at: "2999-01-01" }))).toEqual({ error: "Data da coleta inválida (não pode ser no futuro)." });
  });
});

describe("isPriceId", () => {
  it("aceita só ids no formato do banco", () => {
    expect(isPriceId("3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c")).toBe(true);
    expect(isPriceId("1 or 1=1")).toBe(false);
    expect(isPriceId(42)).toBe(false);
  });
});
