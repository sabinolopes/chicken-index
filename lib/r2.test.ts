import { afterEach, describe, expect, it, vi } from "vitest";
import { deletePhoto, photoKeyFromUrl, uploadPhoto } from "@/lib/r2";

const HASH = "0123456789abcdef".repeat(4);

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

describe("sem configuração do R2", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("falha com erro claro em vez de fingir que enviou (sem modo mock)", async () => {
    vi.stubEnv("R2_ACCOUNT_ID", "");
    const photo = new File([new Uint8Array([1, 2, 3])], "etiqueta.webp", { type: "image/webp" });
    await expect(uploadPhoto(`2026-11/${HASH}.webp`, photo)).rejects.toThrow(/Cloudflare R2 não configurado/);
    await expect(deletePhoto(`2026-11/${HASH}.webp`)).rejects.toThrow(/R2_ACCOUNT_ID/);
  });

  it("exige URL pública em https", async () => {
    vi.stubEnv("R2_ACCOUNT_ID", "conta");
    vi.stubEnv("R2_ACCESS_KEY_ID", "chave");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "segredo");
    vi.stubEnv("R2_BUCKET_NAME", "bucket");
    vi.stubEnv("R2_PUBLIC_URL", "http://pub-abc123.r2.dev");
    await expect(deletePhoto(`2026-11/${HASH}.webp`)).rejects.toThrow(/R2_PUBLIC_URL/);
  });
});
