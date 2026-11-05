import Link from "next/link";
import { BookOpen, Drumstick } from "lucide-react";
import type { ReactNode } from "react";
import { buttonClass } from "@/components/elements/button";

interface SiteHeaderProps {
  /** Página atual, para marcar o item do menu. */
  current?: "como-medimos";
  /** Ação da página ao lado do menu (ex.: "Gerar resumo" no dashboard). */
  action?: ReactNode;
}

/** Barra fixa do site público, no mesmo formato da do admin: marca à esquerda, menu e ação à direita. */
export function SiteHeader({ current, action }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:gap-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Drumstick className="size-5 text-accent" aria-hidden />
          <span>Frangômetro</span>
        </Link>
        <nav aria-label="Menu" className="ml-auto flex items-center text-sm sm:gap-1">
          <Link
            href="/como-medimos"
            aria-current={current === "como-medimos" ? "page" : undefined}
            className={buttonClass("ghost", `whitespace-nowrap ${current === "como-medimos" ? "bg-stone-100 text-foreground" : ""}`)}
          >
            <BookOpen className="hidden size-4 sm:block" aria-hidden />
            Como medimos
          </Link>
          {action}
        </nav>
      </div>
    </header>
  );
}
