import type { ReactNode } from "react";

const TONE_CLASS = {
  success: "bg-emerald-50 font-medium text-emerald-800",
  warning: "bg-amber-50 font-medium text-amber-800",
  /** Destaque forte (ex.: preço promocional sobre a foto). */
  promo: "bg-rose-600 font-semibold text-white",
} as const;

interface BadgeProps {
  tone: keyof typeof TONE_CLASS;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone, icon, children, className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs ${TONE_CLASS[tone]} ${className}`.trim()}>
      {icon}
      {children}
    </span>
  );
}
