import "server-only";
import { AwsClient } from "aws4fetch";

/**
 * Fotos das etiquetas no Cloudflare R2 (API compatível com S3, tráfego de saída
 * gratuito). Só no servidor, e só depois de `requireAdmin()`: as chaves dão escrita
 * no bucket e nunca podem ter prefixo NEXT_PUBLIC_.
 */
function getR2() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  const publicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/\/+$/, "");
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl?.startsWith("https://")) {
    throw new Error(
      "Cloudflare R2 não configurado: defina R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME e R2_PUBLIC_URL (.env.local ou variáveis da Vercel).",
    );
  }
  return {
    client: new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" }),
    objectUrl: (key: string) => `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`,
    publicUrl,
  };
}

/** Envia a foto e devolve a URL pública que vai para `photo_url`. */
export async function uploadPhoto(key: string, photo: File): Promise<string> {
  const r2 = getR2();
  const res = await r2.client.fetch(r2.objectUrl(key), {
    method: "PUT",
    body: await photo.arrayBuffer(),
    headers: {
      "Content-Type": photo.type,
      // O nome é o hash do original: o conteúdo de uma URL nunca muda.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
  if (!res.ok) throw new Error(`R2 respondeu ${res.status}`);
  return `${r2.publicUrl}/${key}`;
}

export async function deletePhoto(key: string): Promise<void> {
  const r2 = getR2();
  const res = await r2.client.fetch(r2.objectUrl(key), { method: "DELETE" });
  if (!res.ok && res.status !== 404) throw new Error(`R2 respondeu ${res.status}`);
}

/** Chave do objeto a partir da URL salva (`AAAA-MM/<sha256>.webp`); null se for de outro lugar. */
export function photoKeyFromUrl(url: string): string | null {
  const match = url.match(/\/(\d{4}-\d{2}\/[0-9a-f]{64}\.(?:webp|jpg))$/);
  return match ? match[1] : null;
}
