import type { ReactNode } from "react";

interface DetailRowProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  /** Valor ausente ("Não disponível"): itálico e apagado. */
  muted?: boolean;
}

/** Par rótulo/valor de uma lista `<dl>` com ícone. */
export function DetailRow({ icon, label, value, muted = false }: DetailRowProps) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-subtle">
        <span aria-hidden>{icon}</span>
        {label}
      </dt>
      <dd className={`mt-0.5 pl-[22px] ${muted ? "text-subtle italic" : "font-medium"}`}>{value}</dd>
    </div>
  );
}
