import Link from "next/link";
import { Drumstick, Share2 } from "lucide-react";
import { Button } from "@/components/elements/button";

/** Título do site e o botão do card para redes (desabilitado enquanto não há indicadores). */
export function DashboardHeader({ onShare, canShare }: { onShare: () => void; canShare: boolean }) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-end sm:justify-between sm:py-8">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-accent">
            <Drumstick className="size-4" aria-hidden />
            Monitor de inflação
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Frangômetro</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Preço do quilo do peito de frango coletado semanalmente em supermercados, com foto da etiqueta auditada por
            metadados EXIF e hash SHA-256.{" "}
            <Link href="/como-medimos" className="font-medium text-foreground underline underline-offset-2 hover:text-accent">
              Como medimos
            </Link>
          </p>
        </div>
        <Button variant="dark" onClick={onShare} disabled={!canShare} className="shrink-0 px-4">
          <Share2 className="size-4" aria-hidden />
          Gerar Resumo para Redes
        </Button>
      </div>
    </header>
  );
}
