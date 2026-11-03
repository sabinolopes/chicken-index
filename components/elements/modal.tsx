"use client";

import { useEffect, type ReactNode } from "react";

const PLACEMENT = {
  /** Centralizado em todas as telas. */
  center: "items-center p-4",
  /** Sobe de baixo no celular (mais fácil de alcançar), centralizado no desktop. */
  sheet: "items-end sm:items-center p-0 sm:p-4",
} as const;

interface ModalProps {
  /** Id do título do conteúdo, que nomeia o diálogo. */
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
  placement?: keyof typeof PLACEMENT;
  /** Tamanho e forma da caixa (largura máxima, cantos, layout interno). */
  className?: string;
}

/** Diálogo sobre a página: fecha no Esc e ao clicar fora, e trava a rolagem do fundo enquanto aberto. */
export function Modal({ labelledBy, onClose, children, placement = "center", className = "" }: ModalProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  return (
    <div className={`fixed inset-0 z-50 flex justify-center bg-black/70 ${PLACEMENT[placement]}`} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(event) => event.stopPropagation()}
        className={`flex w-full flex-col overflow-hidden bg-surface shadow-2xl ${className}`.trim()}
      >
        {children}
      </div>
    </div>
  );
}
