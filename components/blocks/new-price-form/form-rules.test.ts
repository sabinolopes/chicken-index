import { describe, expect, it } from "vitest";
import {
  appendPhoto,
  dateDiffersFromPhoto,
  EMPTY_FIELDS,
  isReadyToSubmit,
  placeOptions,
  priceLooksWrong,
} from "@/components/blocks/new-price-form/form-rules";
import type { ProcessedPhoto } from "@/modules/photos/process-photo";

const filled = { ...EMPTY_FIELDS, price: "21,99", brand: "Sadia", market: "Unidos", city: "Itaperuna", uf: "RJ", recordedAt: "2026-11-02" };

describe("priceLooksWrong", () => {
  it("avisa preço fora da faixa do kg (provável preço da bandeja ou digitação)", () => {
    expect(priceLooksWrong(21.99)).toBe(false);
    expect(priceLooksWrong(5.5)).toBe(true);
    expect(priceLooksWrong(89.9)).toBe(true);
    expect(priceLooksWrong(0)).toBe(false);
  });
});

describe("dateDiffersFromPhoto", () => {
  it("só compara quando há data da câmera e data digitada", () => {
    expect(dateDiffersFromPhoto("2026-11-02", "2026-11-02")).toBe(false);
    expect(dateDiffersFromPhoto("2026-11-02", "2026-11-03")).toBe(true);
    expect(dateDiffersFromPhoto(null, "2026-11-03")).toBe(false);
    expect(dateDiffersFromPhoto("2026-11-02", "")).toBe(false);
  });
});

describe("isReadyToSubmit", () => {
  it("libera o envio com foto pronta e todos os campos", () => {
    expect(isReadyToSubmit({ fields: filled, parsedPrice: 21.99, photoReady: true })).toBe(true);
  });

  it("segura o envio sem foto, sem preço ou com campo vazio (inclusive só espaços)", () => {
    expect(isReadyToSubmit({ fields: filled, parsedPrice: 21.99, photoReady: false })).toBe(false);
    expect(isReadyToSubmit({ fields: filled, parsedPrice: Number.NaN, photoReady: true })).toBe(false);
    expect(isReadyToSubmit({ fields: { ...filled, brand: "" }, parsedPrice: 21.99, photoReady: true })).toBe(false);
    expect(isReadyToSubmit({ fields: { ...filled, market: "   " }, parsedPrice: 21.99, photoReady: true })).toBe(false);
  });
});

describe("appendPhoto", () => {
  it("anexa a foto comprimida e a prova de auditoria que o servidor valida", () => {
    const photo = {
      compressed: new Blob([new Uint8Array(10)], { type: "image/webp" }),
      sha256: "ab".repeat(32),
      hasValidExif: true,
      exif: { device: "Apple iPhone 13", datetime: new Date("2026-11-02T14:00:00Z") },
    } as ProcessedPhoto;

    const formData = appendPhoto(new FormData(), photo);

    const file = formData.get("photo") as File;
    expect([file.name, file.type, file.size]).toEqual(["etiqueta.webp", "image/webp", 10]);
    expect(formData.get("original_sha256")).toBe("ab".repeat(32));
    expect(formData.get("has_valid_exif")).toBe("true");
    expect(formData.get("exif_device")).toBe("Apple iPhone 13");
    expect(formData.get("exif_datetime")).toBe("2026-11-02T14:00:00.000Z");
  });

  it("foto sem EXIF vai com os campos vazios e extensão do formato real", () => {
    const photo = { compressed: new Blob([], { type: "image/jpeg" }), sha256: "cd".repeat(32), hasValidExif: false, exif: { device: null, datetime: null } } as unknown as ProcessedPhoto;

    const formData = appendPhoto(new FormData(), photo);

    expect((formData.get("photo") as File).name).toBe("etiqueta.jpg");
    expect([formData.get("has_valid_exif"), formData.get("exif_device"), formData.get("exif_datetime")]).toEqual(["false", "", ""]);
  });
});

describe("placeOptions", () => {
  it("lista mercados e cidades sem repetir", () => {
    const options = placeOptions([
      { market_name: "Unidos", city: "Itaperuna", state: "RJ" },
      { market_name: "Assaí", city: "Itaperuna", state: "RJ" },
    ]);
    expect(options).toEqual({ markets: ["Unidos", "Assaí"], cities: ["Itaperuna"] });
  });
});
