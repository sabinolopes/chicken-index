import { Camera, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/elements/button";
import { formatBRL, formatDate } from "@/lib/format";
import { PRICE_KIND_LABEL } from "@/modules/prices/types";
import type { PriceInput } from "@/modules/prices/validation";

/** Confirmação do que foi publicado, com atalho para a próxima etiqueta. */
export function SuccessPanel({ message, record, onNext }: { message: string; record: PriceInput; onNext: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="flex items-start gap-2 font-medium">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden />
          {message}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-4 text-sm">
        <p className="text-3xl font-bold tabular">
          {formatBRL(record.price_per_kg)}
          <span className="text-base font-medium text-subtle">/kg</span>
        </p>
        <p className="mt-1 text-muted">
          {record.brand} · {record.state_type} · {PRICE_KIND_LABEL[record.price_kind]} · {record.market_name} · {record.city}/
          {record.state} · {formatDate(record.recorded_at)}
        </p>
        <p className="mt-2 break-all font-mono text-[11px] text-subtle">SHA-256 {record.original_sha256}</p>
      </div>
      <Button variant="primary" onClick={onNext}>
        <Camera className="size-5" aria-hidden />
        Cadastrar outra etiqueta
      </Button>
      <p className="text-center text-xs text-subtle">Mercado, cidade e UF ficam preenchidos para a próxima foto.</p>
    </div>
  );
}
