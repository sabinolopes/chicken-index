"use client";

import { useMemo } from "react";
import { MapPin, RotateCcw, Store, Tag } from "lucide-react";
import type { ChickenPrice } from "@/lib/types";

export interface FilterState {
  state: string;
  city: string;
  market: string;
  brand: string;
}

export const EMPTY_FILTERS: FilterState = { state: "", city: "", market: "", brand: "" };

const uniqueSorted = (values: string[]) => [...new Set(values)].sort((first, second) => first.localeCompare(second, "pt-BR"));

interface Props {
  prices: ChickenPrice[];
  value: FilterState;
  onChange: (next: FilterState) => void;
  resultCount: number;
}

export function Filters({ prices, value, onChange, resultCount }: Props) {
  const options = useMemo(() => {
    const inState = prices.filter((price) => !value.state || price.state === value.state);
    const inCity = inState.filter((price) => !value.city || price.city === value.city);
    return {
      states: uniqueSorted(prices.map((price) => price.state)),
      cities: uniqueSorted(inState.map((price) => price.city)),
      markets: uniqueSorted(inCity.map((price) => price.market_name)),
      brands: uniqueSorted(prices.map((price) => price.brand)),
    };
  }, [prices, value.state, value.city]);

  const active = value.state || value.city || value.market || value.brand;

  return (
    <section aria-label="Filtros" className="rounded-xl border border-border bg-surface p-3 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-none">
          <Select
            label="Estado"
            icon={<MapPin className="size-4" aria-hidden />}
            value={value.state}
            onChange={(state) => onChange({ ...value, state, city: "", market: "" })}
            options={options.states}
            allLabel="UF: todas"
          />
          <Select
            label="Cidade"
            value={value.city}
            onChange={(city) => onChange({ ...value, city, market: "" })}
            options={options.cities}
            allLabel="Cidade: todas"
          />
          <Select
            label="Mercado"
            icon={<Store className="size-4" aria-hidden />}
            value={value.market}
            onChange={(market) => onChange({ ...value, market })}
            options={options.markets}
            allLabel="Todos os mercados"
            className="col-span-2 sm:col-span-1"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Marca">
          <Tag className="size-4 text-subtle mr-0.5" aria-hidden />
          {["", ...options.brands].map((brand) => {
            const selected = value.brand === brand;
            return (
              <button
                key={brand || "all"}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange({ ...value, brand })}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  selected
                    ? "border-foreground bg-foreground text-white"
                    : "border-border bg-surface text-muted hover:border-stone-400"
                }`}
              >
                {brand || "Todas"}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 lg:ml-auto text-sm text-subtle">
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
    </section>
  );
}

function Select({
  label,
  icon,
  value,
  onChange,
  options,
  allLabel,
  className = "",
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  allLabel: string;
  className?: string;
}) {
  return (
    <label className={`relative flex items-center ${className}`}>
      <span className="sr-only">{label}</span>
      {icon && <span className="pointer-events-none absolute left-2.5 text-subtle">{icon}</span>}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full lg:w-auto rounded-lg border border-border bg-surface py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-stone-400 ${
          icon ? "pl-8" : "pl-3"
        }`}
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
