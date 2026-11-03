"use client";

import { useActionState } from "react";
import { Loader2, Send } from "lucide-react";
import { ActionMessage } from "@/components/elements/alert";
import { Button } from "@/components/elements/button";
import { Field, TextInput } from "@/components/elements/field";
import { Panel, PanelHeader } from "@/components/elements/panel";
import { inviteAdmin } from "@/modules/admins/actions";

export function InviteAdminForm() {
  const [state, action, pending] = useActionState(inviteAdmin, null);

  return (
    <Panel labelledBy="invite-title">
      <PanelHeader id="invite-title" title="Convidar admin" />
      <form action={action} className="mt-3 space-y-3">
        <Field htmlFor="invite-email" label="E-mail">
          <TextInput id="invite-email" name="email" type="email" required autoComplete="off" placeholder="nome@exemplo.com" />
        </Field>

        <ActionMessage result={state} />

        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
          {pending ? "Enviando…" : "Enviar convite"}
        </Button>
      </form>
    </Panel>
  );
}
