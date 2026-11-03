import { BadgeCheck, Fingerprint, Smartphone, TriangleAlert } from "lucide-react";
import { Alert } from "@/components/elements/alert";
import { Badge } from "@/components/elements/badge";
import { formatDateTime } from "@/lib/format";
import type { ProcessedPhoto } from "@/modules/photos/process-photo";
import { formatKilobytes, OLD_PHOTO_DAYS } from "./form-rules";

/** Prévia da foto comprimida com o que foi lido do original: EXIF, aparelho, hash e tamanhos. */
export function PhotoSummary({ photo }: { photo: ProcessedPhoto }) {
  const capturedAt = photo.exif.datetime;
  return (
    <>
      <div className="flex gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- preview local (blob:) */}
        <img src={photo.previewUrl} alt="Prévia da foto comprimida" className="h-28 w-28 shrink-0 rounded-lg object-cover sm:h-32 sm:w-32" />
        <div className="min-w-0 flex-1 space-y-1.5 text-sm">
          {photo.hasValidExif ? (
            <Badge tone="success" icon={<BadgeCheck className="size-3.5" aria-hidden />}>
              EXIF original encontrado
            </Badge>
          ) : (
            <Badge tone="warning" icon={<TriangleAlert className="size-3.5" aria-hidden />}>
              Sem EXIF
            </Badge>
          )}
          <p className="flex items-center gap-1.5 text-muted">
            <Smartphone className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{photo.exif.device ?? "Aparelho desconhecido"}</span>
          </p>
          {capturedAt && <p className="text-muted">Capturada em {formatDateTime(capturedAt.toISOString())}</p>}
          <p className="flex items-center gap-1.5 font-mono text-[11px] text-subtle" title={photo.sha256}>
            <Fingerprint className="size-3.5 shrink-0" aria-hidden />
            {photo.sha256.slice(0, 16)}…
          </p>
          <p className="text-xs text-subtle tabular">
            {formatKilobytes(photo.originalBytes)} → {formatKilobytes(photo.compressedBytes)} · {photo.width}×{photo.height} ·{" "}
            {photo.compressed.type === "image/webp" ? "webp" : "jpg"}
          </p>
        </div>
      </div>

      {!photo.hasValidExif && (
        <Alert tone="warning">
          Esta foto perdeu os metadados originais da câmera (comum em fotos repassadas por WhatsApp ou capturas de tela). Você
          pode enviar, mas ela aparecerá como <strong>“Sem EXIF original”</strong> no site. Prefira a foto original do aparelho.
        </Alert>
      )}
      {photo.ageDays !== null && photo.ageDays > OLD_PHOTO_DAYS && <Alert tone="warning">Atenção: a foto foi tirada há {photo.ageDays} dias.</Alert>}
    </>
  );
}
