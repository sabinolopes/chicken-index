import { Share2 } from "lucide-react";
import { SiteHeader } from "@/components/blocks/site-header";
import { Button } from "@/components/elements/button";

/** Barra do site com o botão do card para redes (desabilitado enquanto não há indicadores) e o título da página. */
export function DashboardHeader({ onShare, canShare }: { onShare: () => void; canShare: boolean }) {
  return (
    <>
      <SiteHeader
        action={
          <Button variant="dark" onClick={onShare} disabled={!canShare} className="shrink-0 whitespace-nowrap sm:ml-1">
            <Share2 className="hidden size-4 sm:block" aria-hidden />
            <span className="sm:hidden">Resumo</span>
            <span className="hidden sm:inline">Gerar resumo para redes</span>
          </Button>
        }
      />
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Monitor de inflação</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Frangômetro</h1>
          <p className="mt-2 max-w-2xl text-muted">Preço do quilo do peito de frango coletado semanalmente em supermercados.</p>
        </div>
      </section>
    </>
  );
}
