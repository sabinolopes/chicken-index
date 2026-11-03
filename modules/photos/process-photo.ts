/**
 * Pipeline antifraude do upload, 100% no navegador e nesta ordem:
 * 1) lê o arquivo original intacto → 2) SHA-256 → 3) EXIF → 4) compressão.
 * A compressão via canvas descarta todos os metadados (inclusive GPS) da foto publicada.
 */

interface PhotoExif {
  datetime: Date | null;
  device: string | null;
}

export interface ProcessedPhoto {
  sha256: string;
  exif: PhotoExif;
  hasValidExif: boolean;
  /** Dias entre a captura (EXIF) e o processamento; null sem EXIF. */
  ageDays: number | null;
  compressed: Blob;
  previewUrl: string;
  originalBytes: number;
  compressedBytes: number;
  width: number;
  height: number;
}

export type ProcessStep = "hash" | "exif" | "compress";

const MAX_SIDE = 1200;
const TARGET_BYTES = 150 * 1024;

export async function sha256Hex(buffer: ArrayBuffer) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Este navegador não liberou a Web Crypto API. Acesse o site por HTTPS (ou localhost) para calcular o hash.");
  }
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function formatDevice(make?: unknown, model?: unknown) {
  const maker = typeof make === "string" ? make.trim() : "";
  const modelName = typeof model === "string" ? model.trim() : "";
  if (!maker && !modelName) return null;
  const brand = maker ? maker.charAt(0).toUpperCase() + maker.slice(1).toLowerCase() : "";
  // "Apple" + "iPhone 13" → "Apple iPhone 13"; evita "Samsung Samsung SM-…"
  return modelName.toLowerCase().startsWith(maker.toLowerCase()) ? modelName : `${brand} ${modelName}`.trim();
}

async function readExif(buffer: ArrayBuffer): Promise<PhotoExif> {
  try {
    const { default: exifr } = await import("exifr"); // carregado só quando há foto
    const tags = await exifr.parse(buffer, { pick: ["DateTimeOriginal", "Make", "Model"] });
    const exifDate = tags?.DateTimeOriginal;
    return {
      datetime: exifDate instanceof Date && !Number.isNaN(exifDate.getTime()) ? exifDate : null,
      device: formatDevice(tags?.Make, tags?.Model),
    };
  } catch {
    return { datetime: null, device: null };
  }
}

/**
 * Decodifica a imagem já com a orientação EXIF aplicada. Evita `img.decode()`, que
 * espera um frame renderizado e trava se a aba for para segundo plano no meio do envio.
 */
async function loadImage(file: Blob): Promise<{ source: CanvasImageSource; width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height };
    } catch {
      // formato que o createImageBitmap não abre — tenta via <img>
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight };
  } catch {
    throw new Error("Não foi possível abrir esta imagem neste navegador. Tente uma foto em JPEG.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

/** Redimensiona para no máx. 1200px e busca ~150 KB em .webp (ou .jpg onde o canvas não gera webp, ex. Safari antigo). */
async function compressImage(file: Blob) {
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas indisponível neste navegador.");
  context.drawImage(img.source, 0, 0, width, height);
  if (img.source instanceof ImageBitmap) img.source.close();

  const probe = await toBlob(canvas, "image/webp", 0.8);
  const type = probe?.type === "image/webp" ? "image/webp" : "image/jpeg";

  let quality = 0.82;
  let blob = type === "image/webp" && probe ? probe : await toBlob(canvas, type, quality);
  while (blob && blob.size > TARGET_BYTES && quality > 0.45) {
    quality -= 0.08;
    blob = await toBlob(canvas, type, quality);
  }
  if (!blob) throw new Error("Falha ao comprimir a foto.");
  return { blob, width, height };
}

export async function processPhoto(file: File, onStep?: (step: ProcessStep) => void): Promise<ProcessedPhoto> {
  const original = await file.arrayBuffer();

  onStep?.("hash");
  const sha256 = await sha256Hex(original);

  onStep?.("exif");
  const exif = await readExif(original);

  onStep?.("compress");
  const { blob, width, height } = await compressImage(file);

  return {
    sha256,
    exif,
    hasValidExif: exif.datetime !== null && exif.device !== null,
    ageDays: exif.datetime ? Math.floor((Date.now() - exif.datetime.getTime()) / 86_400_000) : null,
    compressed: blob,
    previewUrl: URL.createObjectURL(blob),
    originalBytes: file.size,
    compressedBytes: blob.size,
    width,
    height,
  };
}

/** Data local (YYYY-MM-DD) de um Date, sem conversão para UTC. */
export function localIsoDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
