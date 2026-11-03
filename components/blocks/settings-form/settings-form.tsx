"use client";

import { useActionState, useState } from "react";
import { Save } from "lucide-react";
import { ActionMessage } from "@/components/elements/alert";
import { Button } from "@/components/elements/button";
import { Field } from "@/components/elements/field";
import { MoneyInput } from "@/components/elements/money-input";
import { Panel, PanelHeader } from "@/components/elements/panel";
import { centsFromNumber, formatDateTime } from "@/lib/format";
import { updateSettings } from "@/modules/settings/actions";
import type { EconomicSettings } from "@/modules/settings/types";

const WAGE_MAX_DIGITS = 8; // até 999.999,99

export function SettingsForm({ settings }: { settings: EconomicSettings }) {
  const [state, action, pending] = useActionState(updateSettings, null);
  const [minWage, setMinWage] = useState(() => centsFromNumber(settings.min_wage));
  const [avgWage, setAvgWage] = useState(() => centsFromNumber(settings.avg_wage));

  return (
    <Panel labelledBy="settings-title">
      <PanelHeader
        id="settings-title"
        title="Salários de referência"
        description={`Usados no Termômetro Salarial do dashboard. Atualizado em ${formatDateTime(settings.updated_at)}.`}
      />

      <form action={action} className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field htmlFor="min_wage" label="Salário mínimo (R$)">
            <MoneyInput id="min_wage" name="min_wage" required maxDigits={WAGE_MAX_DIGITS} value={minWage} onValueChange={setMinWage} />
          </Field>
          <Field htmlFor="avg_wage" label="Salário médio (R$)">
            <MoneyInput id="avg_wage" name="avg_wage" required maxDigits={WAGE_MAX_DIGITS} value={avgWage} onValueChange={setAvgWage} />
          </Field>
        </div>

        <ActionMessage result={state} />

        <Button type="submit" disabled={pending}>
          <Save className="size-4" aria-hidden />
          {pending ? "Salvando…" : "Salvar salários"}
        </Button>
      </form>
    </Panel>
  );
}
