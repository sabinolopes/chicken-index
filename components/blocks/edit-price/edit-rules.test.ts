import { describe, expect, it } from "vitest";
import { fieldsFromPrice, photoDayOf } from "@/components/blocks/edit-price/edit-rules";
import type { ChickenPrice } from "@/modules/prices/types";

const price: ChickenPrice = {
  id: "3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c",
  brand: "Sadia",
  state_type: "congelado",
  price_kind: "oferta",
  price_per_kg: 19.39,
  market_name: "Lizeu",
  city: "Itaperuna",
  state: "RJ",
  recorded_at: "2026-11-04",
  photo_url: "https://pub-teste.r2.dev/2026-11/foto.webp",
  original_sha256: "ab".repeat(32),
  exif_device: "Apple iPhone 13",
  exif_datetime: "2026-11-04T15:00:00.000Z",
  has_valid_exif: true,
  created_at: "2026-11-04T15:10:00.000Z",
  updated_at: null,
};

describe("fieldsFromPrice", () => {
  it("abre o formulário com os dados atuais e o preço no formato do campo", () => {
    expect(fieldsFromPrice(price)).toEqual({
      price: "19,39",
      brand: "Sadia",
      otherBrand: "",
      stateType: "congelado",
      priceKind: "oferta",
      market: "Lizeu",
      city: "Itaperuna",
      uf: "RJ",
      recordedAt: "2026-11-04",
    });
  });

  it("Pif Paf, como as outras principais, abre já no botão da marca", () => {
    const fields = fieldsFromPrice({ ...price, brand: "Pif Paf" });
    expect([fields.brand, fields.otherBrand]).toEqual(["Pif Paf", ""]);
  });

  it("marca fora das principais abre em 'Outra' com o nome já digitado", () => {
    const fields = fieldsFromPrice({ ...price, brand: "Oi Frango" });
    expect([fields.brand, fields.otherBrand]).toEqual(["Outra", "Oi Frango"]);
  });
});

describe("photoDayOf", () => {
  it("usa o dia da câmera só quando o EXIF é válido", () => {
    expect(photoDayOf({ has_valid_exif: true, exif_datetime: "2026-11-04T15:00:00.000Z" })).toBe("2026-11-04");
    expect(photoDayOf({ has_valid_exif: false, exif_datetime: "2026-11-04T15:00:00.000Z" })).toBeNull();
    expect(photoDayOf({ has_valid_exif: true, exif_datetime: null })).toBeNull();
  });
});
