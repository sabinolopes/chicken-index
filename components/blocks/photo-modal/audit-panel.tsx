import { Calendar, Fingerprint, Smartphone } from "lucide-react";
import { AuditBadge } from "@/components/blocks/price-badges";
import { CopyButton } from "@/components/elements/copy-button";
import { formatDateTime } from "@/lib/format";
import type { ChickenPrice } from "@/modules/prices/types";
import { DetailRow } from "./detail-row";

/** Dados técnicos que sustentam a prova: aparelho, horário da captura e hash do original. */
export function AuditPanel({ price }: { price: ChickenPrice }) {
  return (
    <div className="mx-4 mb-4 rounded-xl border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Auditoria da foto</h3>
        <AuditBadge audited={price.has_valid_exif} />
      </div>

      <dl className="mt-3 space-y-3 text-sm">
        <DetailRow
          icon={<Smartphone className="size-4" />}
          label="Aparelho (EXIF Make/Model)"
          value={price.exif_device ?? "Não disponível"}
          muted={!price.exif_device}
        />
        <DetailRow
          icon={<Calendar className="size-4" />}
          label="Capturada em (EXIF DateTimeOriginal)"
          value={price.exif_datetime ? formatDateTime(price.exif_datetime) : "Não disponível"}
          muted={!price.exif_datetime}
        />
        <div>
          <dt className="flex items-center gap-1.5 text-subtle">
            <Fingerprint className="size-4" aria-hidden />
            SHA-256 do arquivo original
          </dt>
          <dd className="mt-1 flex items-start gap-2">
            <code className="min-w-0 flex-1 break-all rounded-md border border-border bg-surface px-2 py-1.5 font-mono text-[11px] leading-relaxed text-foreground">
              {price.original_sha256}
            </code>
            <CopyButton
              text={price.original_sha256}
              ariaLabel="Copiar hash"
              className="rounded-md border border-border bg-surface p-1.5 text-muted hover:text-foreground"
            />
          </dd>
        </div>
      </dl>

      {!price.has_valid_exif && (
        <p className="mt-3 rounded-md bg-amber-50 p-2 text-xs text-amber-900">
          Esta foto chegou sem metadados de câmera (ex.: repassada por WhatsApp). O hash SHA-256 ainda identifica o arquivo
          recebido, mas não há como confirmar aparelho e horário da captura.
        </p>
      )}
      <p className="mt-3 text-xs text-subtle">
        O hash foi calculado no navegador sobre o arquivo original, antes da compressão para .webp. Quem tiver o original
        pode conferir com <code className="font-mono">sha256sum foto.jpg</code>.
      </p>
    </div>
  );
}
