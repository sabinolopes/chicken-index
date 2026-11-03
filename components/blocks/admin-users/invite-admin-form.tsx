"use client";

import { useActionState } from "react";
import { Link2, Loader2, Send } from "lucide-react";
import { ActionMessage } from "@/components/elements/alert";
import { Button } from "@/components/elements/button";
import { Field, TextInput } from "@/components/elements/field";
import { Panel, PanelHeader } from "@/components/elements/panel";
import { inviteAdmin } from "@/modules/admins/actions";
import { InviteLinkBox } from "./invite-link-box";

export function InviteAdminForm() {
  const [state, action, pending] = useActionState(inviteAdmin, null);
  const icon = (Icon: typeof Send) => (pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Icon className="size-4" aria-hidden />);

  return (
    <Panel labelledBy="invite-title">
      <PanelHeader
        id="invite-title"
        title="Convidar admin"
        description="Por e-mail, ou gere o link para mandar pelo WhatsApp (o e-mail do plano gratuito tem limite de poucos envios por hora)."
      />
      <form action={action} className="mt-3 space-y-3">
        <Field htmlFor="invite-email" label="E-mail">
          <TextInput id="invite-email" name="email" type="email" required autoComplete="off" placeholder="nome@exemplo.com" />
        </Field>

        {state?.ok && "link" in state ? <InviteLinkBox message={state.message} link={state.link} /> : <ActionMessage result={state} />}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" name="delivery" value="email" disabled={pending}>
            {icon(Send)}
            Enviar por e-mail
          </Button>
          <Button type="submit" name="delivery" value="link" disabled={pending}>
            {icon(Link2)}
            Gerar link
          </Button>
        </div>
      </form>
    </Panel>
  );
}
