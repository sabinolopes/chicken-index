import type { ReactNode } from "react";

const PADDING = {
  none: "",
  compact: "p-3 sm:p-4",
  default: "p-4",
  roomy: "p-4 sm:p-6",
} as const;

interface PanelProps {
  children: ReactNode;
  padding?: keyof typeof PADDING;
  /** Id do título (`PanelHeader`) que nomeia a seção. */
  labelledBy?: string;
  ariaLabel?: string;
  className?: string;
}

/** Cartão branco com borda: a moldura de toda seção do site e do painel. */
export function Panel({ children, padding = "default", labelledBy, ariaLabel, className = "" }: PanelProps) {
  return (
    <section
      aria-labelledby={labelledBy}
      aria-label={ariaLabel}
      className={`rounded-xl border border-border bg-surface ${PADDING[padding]} ${className}`.trim()}
    >
      {children}
    </section>
  );
}

interface PanelHeaderProps {
  id: string;
  title: ReactNode;
  icon?: ReactNode;
  description?: ReactNode;
  /** Conteúdo à direita do título (contagem, botões de visualização). */
  aside?: ReactNode;
  /** `lg` para seções do dashboard público; `md` para o painel admin. */
  size?: "md" | "lg";
  /** Faixa com linha embaixo, para cabeçalho de lista. */
  bar?: boolean;
}

export function PanelHeader({ id, title, icon, description, aside, size = "md", bar = false }: PanelHeaderProps) {
  const titleClass = size === "lg" ? "flex items-center gap-2 text-lg font-semibold" : "flex items-center gap-2 font-semibold";
  const layout = bar ? "flex items-baseline justify-between gap-2 border-b border-border px-4 py-3" : "flex flex-wrap items-start justify-between gap-3";
  return (
    <div className={layout}>
      <div>
        <h2 id={id} className={titleClass}>
          {icon}
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {aside}
    </div>
  );
}
