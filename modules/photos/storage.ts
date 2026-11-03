import "server-only";
import { AwsClient } from "aws4fetch";

/** O que o cadastro de preços precisa de um armazenamento de fotos (o R2 em produção). */
export interface PhotoStorage {
  /** Grava a foto e devolve a URL pública que vai para `photo_url`. */
  upload(key: string, photo: File): Promise<string>;
  remove(key: string): Promise<void>;
}

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
  const url = r2.objectUrl(key);
  const body = await photo.arrayBuffer();
  const signed = await r2.client.sign(url, {
    method: "PUT",
    body,
    headers: {
      "Content-Type": photo.type,
      // O nome é o hash do original: o conteúdo de uma URL nunca muda.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
  // Só assinamos com o aws4fetch e enviamos os bytes nós mesmos: o fetch do Next
  // reconstrói um Request como stream, sem Content-Length, e o R2 responde 411.
  const response = await fetch(url, { method: "PUT", headers: signed.headers, body });
  if (!response.ok) throw new Error(`R2 respondeu ${response.status}`);
  return `${r2.publicUrl}/${key}`;
}

export async function deletePhoto(key: string): Promise<void> {
  const r2 = getR2();
  const response = await r2.client.fetch(r2.objectUrl(key), { method: "DELETE" });
  if (!response.ok && response.status !== 404) throw new Error(`R2 respondeu ${response.status}`);
}

export const r2PhotoStorage: PhotoStorage = { upload: uploadPhoto, remove: deletePhoto };
