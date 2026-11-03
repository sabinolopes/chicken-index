"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

const CONFIRMATION_MS = 1500;

/** Copia texto e indica "copiado" por um instante. Sem permissão de clipboard, não faz nada (o texto continua selecionável). */
export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), CONFIRMATION_MS);
  }

  return { copied, copy };
}

interface CopyButtonProps {
  text: string;
  /** Rótulo visível; sem ele, o botão mostra só o ícone e usa `ariaLabel`. */
  label?: string;
  ariaLabel?: string;
  className: string;
}

export function CopyButton({ text, label, ariaLabel, className }: CopyButtonProps) {
  const { copied, copy } = useCopyToClipboard();
  const icon = copied ? <Check className="size-4 text-emerald-700" aria-hidden /> : <Copy className="size-4" aria-hidden />;
  return (
    <button type="button" onClick={() => copy(text)} aria-label={label ? undefined : ariaLabel} className={className}>
      {icon}
      {label && (copied ? "Copiado!" : label)}
    </button>
  );
}
