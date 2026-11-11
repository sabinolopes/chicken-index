import { ArrowUpRight, Drumstick } from "lucide-react";
import type { LinkPreview, PreviewTone } from "@/modules/dashboard/link-preview";

const TONE_CLASS: Record<PreviewTone, string> = {
  up: "bg-red-50 text-red-700",
  down: "bg-emerald-50 text-emerald-700",
  stable: "bg-stone-100 text-muted",
};

const TONE_ARROW: Record<PreviewTone, string> = { up: "▲", down: "▼", stable: "■" };

/**
 * Card compacto para outros sites colarem num iframe (ex.: bloco "HTML personalizado" do
 * WordPress). Os links abrem o Frangômetro numa aba nova, fora do iframe; "/" dentro do iframe já
 * aponta para o domínio do Frangômetro. Sem cantos arredondados: o fundo da página não aparece nas bordas.
 */
export function Widget({ preview }: { preview: LinkPreview | null }) {
  return (
    <main className="flex min-h-full flex-1 flex-col justify-between gap-3 border border-border bg-surface p-4">
      <a href="/" target="_blank" rel="noopener" className="flex items-center gap-1.5 text-sm font-semibold">
        <Drumstick className="size-4 text-accent" aria-hidden />
        Frangômetro
        {/* Dentro do iframe, a largura da tela é a do iframe: some na barra lateral estreita. */}
        <span className="hidden font-normal text-subtle min-[360px]:inline">· preço do peito de frango</span>
      </a>

      {preview ? (
        <div>
          <p className="text-xs text-subtle">Preço médio do kg · {preview.week}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-3xl font-bold tracking-tight tabular">{preview.price}</p>
            {preview.change && (
              <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold tabular ${TONE_CLASS[preview.change.tone]}`}>
                {TONE_ARROW[preview.change.tone]} {preview.change.text}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">{preview.wage}</p>
        </div>
      ) : (
        <p className="text-sm text-muted">Ainda não há preços publicados.</p>
      )}

      <a
        href="/"
        target="_blank"
        rel="noopener"
        className="inline-flex items-center gap-1 self-start text-sm font-medium text-accent underline-offset-2 hover:underline"
      >
        Ver as fotos das etiquetas
        <ArrowUpRight className="size-4" aria-hidden />
      </a>
    </main>
  );
}
