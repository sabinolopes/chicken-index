import type { ReactNode } from "react";

interface FormSectionProps {
  legend: string;
  children: ReactNode;
  /** Desabilita todos os campos da seção (ex.: até escolher a foto). */
  disabled?: boolean;
  className?: string;
}

/** Etapa numerada de um formulário: borda com o título "recortado" na linha (`<legend>`). */
export function FormSection({ legend, children, disabled, className = "" }: FormSectionProps) {
  return (
    <fieldset disabled={disabled} className={`rounded-xl border border-border bg-surface px-4 pb-4 pt-3 ${className}`.trim()}>
      <legend className="ml-2 px-2 text-sm font-medium text-muted">{legend}</legend>
      {children}
    </fieldset>
  );
}
