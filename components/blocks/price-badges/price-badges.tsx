import { BadgeCheck, Tag, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/elements/badge";
import { PRICE_KIND_LABEL, type PriceKind } from "@/modules/prices/types";

/** Selo de oferta/clube: avisa que o preço não é o normal e fica fora do índice. */
export function PriceKindBadge({ kind, className }: { kind: PriceKind; className?: string }) {
  return (
    <Badge tone="promo" icon={<Tag className="size-3.5" aria-hidden />} className={className}>
      {PRICE_KIND_LABEL[kind]}
    </Badge>
  );
}

/** Se a foto chegou com o EXIF original da câmera (o hash existe sempre). */
export function AuditBadge({ audited }: { audited: boolean }) {
  if (audited) {
    return (
      <Badge tone="success" icon={<BadgeCheck className="size-3.5" aria-hidden />}>
        Foto Auditada (EXIF + SHA256)
      </Badge>
    );
  }
  return (
    <Badge tone="warning" icon={<TriangleAlert className="size-3.5" aria-hidden />}>
      Sem EXIF original · SHA256
    </Badge>
  );
}
