import type { ReactNode } from "react";

const SELECTED = "border-foreground bg-foreground text-white";

const VARIANT = {
  /** Botões grandes em grade, para o polegar no celular (cadastro). */
  tile: {
    group: "grid gap-2",
    option: "rounded-lg border px-3 py-3 text-sm font-medium",
    selected: SELECTED,
    idle: "border-border bg-surface hover:border-stone-400",
  },
  /** Pílulas compactas em linha (filtros). */
  pill: {
    group: "flex flex-wrap items-center gap-1.5",
    option: "rounded-full border px-3 py-1.5 text-sm transition-colors",
    selected: SELECTED,
    idle: "border-border bg-surface text-muted hover:border-stone-400",
  },
  /** Alternância de visualização dentro de uma moldura (gráfico/tabela). */
  segmented: {
    group: "inline-flex rounded-lg border border-border p-0.5 text-sm",
    option: "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1",
    selected: "bg-foreground text-white",
    idle: "text-muted hover:text-foreground",
  },
} as const;

interface ChoiceGroupProps<Value extends string> {
  /** Nome do grupo para leitor de tela. */
  label: string;
  options: readonly Value[];
  value: Value;
  onChange: (value: Value) => void;
  /** Texto (ou ícone + texto) de cada opção; sem ele, mostra o próprio valor. */
  labels?: Partial<Record<Value, ReactNode>>;
  /** Com `name`, envia o valor escolhido junto do formulário. */
  name?: string;
  variant?: keyof typeof VARIANT;
  /** Colunas da grade ou ajustes da linha (ex.: "grid-cols-3"). */
  className?: string;
  optionClassName?: string;
  /** Algo antes das opções, dentro do grupo (ex.: ícone do filtro). */
  leading?: ReactNode;
}

/** Escolha única entre poucas opções, como botões (`role="radiogroup"`). */
export function ChoiceGroup<Value extends string>({
  label,
  options,
  value,
  onChange,
  labels,
  name,
  variant = "tile",
  className = "",
  optionClassName = "",
  leading,
}: ChoiceGroupProps<Value>) {
  const style = VARIANT[variant];
  return (
    <div className={`${style.group} ${className}`.trim()} role="radiogroup" aria-label={label}>
      {name && <input type="hidden" name={name} value={value} />}
      {leading}
      {options.map((option) => {
        const selected = option === value;
        return (
          <button
            key={option || "empty"}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option)}
            className={`${style.option} ${selected ? style.selected : style.idle} ${optionClassName}`.trim()}
          >
            {labels?.[option] ?? option}
          </button>
        );
      })}
    </div>
  );
}
