import type { ReactNode } from "react";

/** Bloco cinza pulsante no lugar de um conteúdo que ainda está carregando. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-stone-200/70 ${className}`.trim()} aria-hidden />;
}

/** Moldura de um skeleton: anuncia "carregando" para leitor de tela e esconde os blocos cinza. */
export function LoadingRegion({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
