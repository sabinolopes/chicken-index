/**
 * Nome do arquivo no armazenamento: `AAAA-MM/<sha256>.webp`. O hash do original
 * garante que o conteúdo de uma URL nunca muda (cache eterno) e que a mesma foto
 * não ocupa espaço duas vezes.
 */
export function photoKeyFor({ recordedAt, sha256, mimeType }: { recordedAt: string; sha256: string; mimeType: string }) {
  const extension = mimeType === "image/webp" ? "webp" : "jpg";
  return `${recordedAt.slice(0, 7)}/${sha256}.${extension}`;
}

/** Chave do arquivo a partir da URL salva em `photo_url`; null se a URL não seguir o padrão. */
export function photoKeyFromUrl(url: string): string | null {
  const match = url.match(/\/(\d{4}-\d{2}\/[0-9a-f]{64}\.(?:webp|jpg))$/);
  return match ? match[1] : null;
}
