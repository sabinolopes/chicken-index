import { afterEach, describe, expect, it, vi } from "vitest";
import { deletePhoto, uploadPhoto } from "@/modules/photos/storage";

const KEY = `2026-11/${"0123456789abcdef".repeat(4)}.webp`;

describe("sem configuração do R2", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("falha com erro claro em vez de fingir que enviou (sem modo mock)", async () => {
    vi.stubEnv("R2_ACCOUNT_ID", "");
    const photo = new File([new Uint8Array([1, 2, 3])], "etiqueta.webp", { type: "image/webp" });
    await expect(uploadPhoto(KEY, photo)).rejects.toThrow(/Cloudflare R2 não configurado/);
    await expect(deletePhoto(KEY)).rejects.toThrow(/R2_ACCOUNT_ID/);
  });

  it("exige URL pública em https", async () => {
    vi.stubEnv("R2_ACCOUNT_ID", "conta");
    vi.stubEnv("R2_ACCESS_KEY_ID", "chave");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "segredo");
    vi.stubEnv("R2_BUCKET_NAME", "bucket");
    vi.stubEnv("R2_PUBLIC_URL", "http://pub-abc123.r2.dev");
    await expect(deletePhoto(KEY)).rejects.toThrow(/R2_PUBLIC_URL/);
  });
});
