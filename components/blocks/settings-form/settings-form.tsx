"use client";

import { useActionState, useState } from "react";
import { Pencil, Save } from "lucide-react";
import { ActionMessage } from "@/components/elements/alert";
import { Button } from "@/components/elements/button";
import { Field } from "@/components/elements/field";
import { MoneyInput } from "@/components/elements/money-input";
import { Panel, PanelHeader } from "@/components/elements/panel";
import { centsFromNumber, formatBRL, formatDateTime } from "@/lib/format";
import { updateSettings } from "@/modules/settings/actions";
import type { EconomicSettings } from "@/modules/settings/types";

const WAGE_MAX_DIGITS = 8; // até 999.999,99

/**
 * Salários do Termômetro Salarial. Mudam raramente: fica fechado numa linha com os
 * valores atuais e só abre os campos ao clicar em "Editar".
 */
export function SettingsForm({ settings }: { settings: EconomicSettings }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(updateSettings, null);
  const [minWage, setMinWage] = useState(() => centsFromNumber(settings.min_wage));
  const [avgWage, setAvgWage] = useState(() => centsFromNumber(settings.avg_wage));

  return (
    <Panel labelledBy="settings-title">
      <PanelHeader
        id="settings-title"
        title="Salários de referência"
        description={
          <>
            Mínimo <strong className="font-semibold text-foreground tabular">{formatBRL(settings.min_wage)}</strong> · Médio{" "}
            <strong className="font-semibold text-foreground tabular">{formatBRL(settings.avg_wage)}</strong>
            <span className="block text-xs text-subtle">Atualizado em {formatDateTime(settings.updated_at)}</span>
          </>
        }
        aside={
          !editing && (
            <Button onClick={() => setEditing(true)}>
              <Pencil className="size-4" aria-hidden />
              Editar
            </Button>
          )
        }
      />

      {editing && (
        <form action={action} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field htmlFor="min_wage" label="Salário mínimo (R$)">
              <MoneyInput id="min_wage" name="min_wage" required autoFocus maxDigits={WAGE_MAX_DIGITS} value={minWage} onValueChange={setMinWage} />
            </Field>
            <Field htmlFor="avg_wage" label="Salário médio (R$)">
              <MoneyInput id="avg_wage" name="avg_wage" required maxDigits={WAGE_MAX_DIGITS} value={avgWage} onValueChange={setAvgWage} />
            </Field>
          </div>

          <ActionMessage result={state} />

          <div className="flex gap-2">
            <Button type="submit" variant="dark" disabled={pending}>
              <Save className="size-4" aria-hidden />
              {pending ? "Salvando…" : "Salvar salários"}
            </Button>
            <Button onClick={() => setEditing(false)} disabled={pending}>
              Fechar
            </Button>
          </div>
        </form>
      )}
    </Panel>
  );
}
