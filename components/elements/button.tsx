import type { ButtonHTMLAttributes } from "react";

const VARIANT_CLASS = {
  /** Ação principal da tela (largura total, alto, fundo escuro). */
  primary:
    "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3.5 text-base font-semibold text-white hover:bg-stone-700 disabled:opacity-40",
  /** Ação secundária com borda. */
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium hover:border-stone-400 disabled:opacity-40",
  /** Ação compacta escura (ex.: "Baixar PNG", "Gerar resumo"). */
  dark: "inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-3 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-40",
  /** Link de navegação discreto (cabeçalho do painel). */
  ghost: "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-muted hover:bg-stone-100 hover:text-foreground",
} as const;

export type ButtonVariant = keyof typeof VARIANT_CLASS;

export const buttonClass = (variant: ButtonVariant, className = "") => `${VARIANT_CLASS[variant]} ${className}`.trim();

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = "secondary", type = "button", className, ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, className)} {...rest} />;
}

const ICON_TONE_CLASS = {
  /** Sobre fundo claro (fechar modal, lixeira). */
  light: "rounded-lg p-1.5 text-muted hover:bg-stone-100 hover:text-foreground disabled:opacity-30",
  /** Sobre fundo escuro (controles de zoom). */
  dark: "rounded-md p-1.5 hover:bg-white/10 disabled:opacity-30",
  /** Ação destrutiva (excluir). */
  danger: "rounded-lg p-2 text-subtle hover:bg-red-50 hover:text-red-700 disabled:opacity-30 disabled:hover:bg-transparent",
} as const;

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  /** Texto para leitor de tela e dica ao passar o mouse (o botão só tem ícone). */
  label: string;
  tone?: keyof typeof ICON_TONE_CLASS;
}

export function IconButton({ label, tone = "light", type = "button", className = "", ...rest }: IconButtonProps) {
  return <button type={type} aria-label={label} title={label} className={`${ICON_TONE_CLASS[tone]} ${className}`.trim()} {...rest} />;
}
