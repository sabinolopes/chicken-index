import { describe, expect, it } from "vitest";
import { photoKeyFor, photoKeyFromUrl } from "@/modules/photos/keys";

const HASH = "0123456789abcdef".repeat(4);

describe("photoKeyFor", () => {
  it("organiza por mês da coleta e nomeia pelo hash do original", () => {
    expect(photoKeyFor({ recordedAt: "2026-11-02", sha256: HASH, mimeType: "image/webp" })).toBe(`2026-11/${HASH}.webp`);
    expect(photoKeyFor({ recordedAt: "2026-01-31", sha256: HASH, mimeType: "image/jpeg" })).toBe(`2026-01/${HASH}.jpg`);
  });

  it("a chave gerada é reconhecida de volta a partir da URL pública", () => {
    const key = photoKeyFor({ recordedAt: "2026-11-02", sha256: HASH, mimeType: "image/webp" });
    expect(photoKeyFromUrl(`https://pub-abc123.r2.dev/${key}`)).toBe(key);
  });
});

describe("photoKeyFromUrl", () => {
  it("extrai a chave de qualquer domínio público (r2.dev hoje, domínio próprio amanhã)", () => {
    expect(photoKeyFromUrl(`https://pub-abc123.r2.dev/2026-11/${HASH}.webp`)).toBe(`2026-11/${HASH}.webp`);
    expect(photoKeyFromUrl(`https://fotos.frangometro.com.br/2026-11/${HASH}.jpg`)).toBe(`2026-11/${HASH}.jpg`);
  });

  it("ignora URLs que não seguem o padrão AAAA-MM/<sha256>", () => {
    expect(photoKeyFromUrl("https://x.supabase.co/storage/v1/object/public/price-photos/2026-11/foto.webp")).toBeNull();
    expect(photoKeyFromUrl(`https://pub-abc123.r2.dev/2026-11/${HASH}.png`)).toBeNull();
    expect(photoKeyFromUrl(`https://pub-abc123.r2.dev/../${HASH}.webp`)).toBeNull();
  });
});
