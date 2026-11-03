/** Bloco cinza pulsante no lugar de um conteúdo que ainda está carregando. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-stone-200/70 ${className}`.trim()} aria-hidden />;
}
