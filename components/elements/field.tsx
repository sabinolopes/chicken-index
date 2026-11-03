import type { InputHTMLAttributes, ReactNode, Ref, SelectHTMLAttributes } from "react";

export const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-3 text-base text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-stone-400 disabled:opacity-50";

export const labelClass = "mb-1.5 block text-sm font-medium text-muted";

interface FieldProps {
  /** `id` do controle; liga o rótulo ao campo. Sem ele, o rótulo vira texto (grupos de botões). */
  htmlFor?: string;
  label: ReactNode;
  /** Aviso abaixo do campo (ex.: valor fora do comum). */
  warning?: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Rótulo + controle + dica/aviso, com o espaçamento padrão dos formulários. */
export function Field({ htmlFor, label, warning, hint, children, className }: FieldProps) {
  return (
    <div className={className}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className={labelClass}>
          {label}
        </label>
      ) : (
        <span className={labelClass}>{label}</span>
      )}
      {children}
      {hint && <p className="mt-1.5 text-xs text-subtle">{hint}</p>}
      {warning && <p className="mt-1 text-sm text-amber-800">{warning}</p>}
    </div>
  );
}

export function TextInput({ className = "", ref, ...rest }: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} className={`${inputClass} ${className}`.trim()} {...rest} />;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: readonly string[];
  /** Primeira opção, de valor vazio (ex.: "—" ou "Todos os mercados"). */
  emptyLabel: string;
}

export function Select({ options, emptyLabel, className = "", ...rest }: SelectProps) {
  return (
    <select className={`${inputClass} ${className}`.trim()} {...rest}>
      <option value="">{emptyLabel}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

/** Autocompletar nativo para um `<input list={id}>`. */
export function Suggestions({ id, options }: { id: string; options: readonly string[] }) {
  return (
    <datalist id={id}>
      {options.map((option) => (
        <option key={option} value={option} />
      ))}
    </datalist>
  );
}
