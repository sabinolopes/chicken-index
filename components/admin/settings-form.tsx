"use client";

import { useActionState } from "react";
import { CheckCircle2, Save, TriangleAlert } from "lucide-react";
import { updateSettings } from "@/app/admin/actions";
import type { EconomicSettings } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { inputClass, labelClass, secondaryButtonClass } from "./ui";

const money = (v: number) => v.toFixed(2).replace(".", ",");

export function SettingsForm({ settings, demo }: { settings: EconomicSettings; demo: boolean }) {
  const [state, action, pending] = useActionState(updateSettings, null);

  return (
    <section aria-labelledby="settings-title" className="rounded-xl border border-border bg-surface p-4">
      <h2 id="settings-title" className="font-semibold">
        Salários de referência
      </h2>
      <p className="mt-1 text-sm text-muted">
        Usados no Termômetro Salarial do dashboard. Atualizado em {formatDateTime(settings.updated_at)}.
      </p>

      <form action={action} className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="min_wage" className={labelClass}>
              Salário mínimo (R$)
            </label>
            <input id="min_wage" name="min_wage" inputMode="decimal" defaultValue={money(settings.min_wage)} disabled={demo} className={inputClass} />
          </div>
          <div>
            <label htmlFor="avg_wage" className={labelClass}>
              Salário médio (R$)
            </label>
            <input id="avg_wage" name="avg_wage" inputMode="decimal" defaultValue={money(settings.avg_wage)} disabled={demo} className={inputClass} />
          </div>
        </div>

        {state && (
          <p
            role="status"
            className={`flex items-center gap-2 rounded-lg p-2.5 text-sm ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}
          >
            {state.ok ? <CheckCircle2 className="size-4" aria-hidden /> : <TriangleAlert className="size-4" aria-hidden />}
            {state.ok ? state.message : state.error}
          </p>
        )}

        <button type="submit" disabled={demo || pending} className={secondaryButtonClass}>
          <Save className="size-4" aria-hidden />
          {pending ? "Salvando…" : "Salvar salários"}
        </button>
      </form>
    </section>
  );
}
