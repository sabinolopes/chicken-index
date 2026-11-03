"use client";

import { useMemo, type ReactNode } from "react";
import { MapPin, RotateCcw, Store, Tag } from "lucide-react";
import { ChoiceGroup } from "@/components/elements/choice-group";
import { Panel } from "@/components/elements/panel";
import type { ChickenPrice } from "@/modules/prices/types";
import { changeFilter, EMPTY_FILTERS, filterOptions, type FilterState } from "./filter-options";

interface FiltersProps {
  prices: ChickenPrice[];
  value: FilterState;
  onChange: (next: FilterState) => void;
  resultCount: number;
}

export function Filters({ prices, value, onChange, resultCount }: FiltersProps) {
  const options = useMemo(() => filterOptions(prices, value), [prices, value]);
  const active = value.state || value.city || value.market || value.brand;
  const update = (field: keyof FilterState) => (next: string) => onChange(changeFilter(value, field, next));

  return (
    <Panel ariaLabel="Filtros" padding="compact">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-none">
          <FilterSelect
            label="Estado"
            icon={<MapPin className="size-4" aria-hidden />}
            value={value.state}
            onChange={update("state")}
            options={options.states}
            allLabel="UF: todas"
          />
          <FilterSelect label="Cidade" value={value.city} onChange={update("city")} options={options.cities} allLabel="Cidade: todas" />
          <FilterSelect
            label="Mercado"
            icon={<Store className="size-4" aria-hidden />}
            value={value.market}
            onChange={update("market")}
            options={options.markets}
            allLabel="Todos os mercados"
            className="col-span-2 sm:col-span-1"
          />
        </div>

        <ChoiceGroup
          label="Marca"
          variant="pill"
          options={["", ...options.brands]}
          labels={{ "": "Todas" }}
          value={value.brand}
          onChange={update("brand")}
          leading={<Tag className="mr-0.5 size-4 text-subtle" aria-hidden />}
        />

        <div className="flex items-center gap-3 text-sm text-subtle lg:ml-auto">
          <span className="tabular">{resultCount} registros</span>
          {active && (
            <button
              type="button"
              onClick={() => onChange(EMPTY_FILTERS)}
              className="inline-flex items-center gap-1 text-foreground underline-offset-2 hover:underline"
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Limpar
            </button>
          )}
        </div>
      </div>
    </Panel>
  );
}

interface FilterSelectProps {
  label: string;
  icon?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  allLabel: string;
  className?: string;
}

/** Select compacto com ícone e rótulo só para leitor de tela. */
function FilterSelect({ label, icon, value, onChange, options, allLabel, className = "" }: FilterSelectProps) {
  return (
    <label className={`relative flex items-center ${className}`}>
      <span className="sr-only">{label}</span>
      {icon && <span className="pointer-events-none absolute left-2.5 text-subtle">{icon}</span>}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-lg border border-border bg-surface py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-stone-400 lg:w-auto ${icon ? "pl-8" : "pl-3"}`}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
