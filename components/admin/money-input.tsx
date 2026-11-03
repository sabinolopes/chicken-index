"use client";

import { maskCents } from "@/lib/format";
import { inputClass } from "./ui";

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "size"> {
  value: string;
  onValueChange: (value: string) => void;
  /** Quantidade máxima de dígitos (incluindo os 2 centavos). */
  maxDigits?: number;
  /** "lg": campo de destaque (preço por kg no cadastro). */
  size?: "md" | "lg";
}

/** Campo em R$ com máscara de centavos: só dígitos, preenchidos da direita ("2199" → 21,99). */
export function MoneyInput({ value, onValueChange, maxDigits = 5, size = "md", className = "", ...rest }: Props) {
  const isLarge = size === "lg";
  return (
    <div className={`relative ${className}`}>
      <span className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-subtle ${isLarge ? "text-xl" : ""}`} aria-hidden>
        R$
      </span>
      <input
        {...rest}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="0,00"
        value={value}
        onChange={(event) => onValueChange(maskCents(event.target.value, maxDigits))}
        className={`${inputClass} tabular ${isLarge ? "pl-12 py-3 text-3xl font-bold" : "pl-10"}`}
      />
    </div>
  );
}
