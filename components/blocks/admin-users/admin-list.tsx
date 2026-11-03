"use client";

import { useState, useTransition } from "react";
import { Clock, Loader2, Mail, Trash2 } from "lucide-react";
import { Alert } from "@/components/elements/alert";
import { IconButton } from "@/components/elements/button";
import { Panel, PanelHeader } from "@/components/elements/panel";
import { formatDateTime } from "@/lib/format";
import { removeAdmin } from "@/modules/admins/actions";
import type { AdminListItem } from "@/modules/admins/service";

const formatLastSignIn = (lastSignInAt: string | null) => (lastSignInAt ? formatDateTime(lastSignInAt) : "—");

/** Pergunta de confirmação: convite pendente é só cancelado; admin ativo perde a conta. */
function removalQuestion(admin: AdminListItem) {
  if (admin.pending) return `Cancelar o convite de ${admin.email}?`;
  const who = admin.name ? `${admin.name} (${admin.email})` : admin.email;
  return `Remover o acesso de admin de ${who}? A conta será apagada.`;
}

export function AdminList({ admins, currentUserId }: { admins: AdminListItem[]; currentUserId: string }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function remove(admin: AdminListItem) {
    if (!confirm(removalQuestion(admin))) return;
    setError(null);
    setPendingId(admin.id);
    startTransition(async () => {
      const result = await removeAdmin(admin.id);
      if (!result.ok) setError(result.error);
      setPendingId(null);
    });
  }

  return (
    <Panel labelledBy="admins-title" padding="none">
      <PanelHeader id="admins-title" title="Admins atuais" bar aside={<span className="text-sm text-subtle tabular">{admins.length}</span>} />

      {error && (
        <Alert tone="error" className="m-3">
          {error}
        </Alert>
      )}

      <ul className="divide-y divide-border">
        {admins.map((admin) => (
          <li key={admin.id} className="flex items-center gap-3 px-4 py-3">
            <Mail className="size-4 shrink-0 text-subtle" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {admin.name ?? admin.email} {admin.id === currentUserId && <span className="text-sm font-normal text-subtle">(você)</span>}
              </p>
              {admin.name && <p className="truncate text-sm text-muted">{admin.email}</p>}
              <p className="text-xs text-subtle">
                {admin.pending ? (
                  <span className="inline-flex items-center gap-1 text-amber-800">
                    <Clock className="size-3.5" aria-hidden />
                    Convite pendente{admin.invitedAt && ` · enviado em ${formatDateTime(admin.invitedAt)}`}
                  </span>
                ) : (
                  `Último acesso: ${formatLastSignIn(admin.lastSignInAt)}`
                )}
              </p>
            </div>
            {admin.id !== currentUserId && (
              <IconButton
                tone="danger"
                label={admin.pending ? `Cancelar convite de ${admin.email}` : `Remover ${admin.name ?? admin.email}`}
                onClick={() => remove(admin)}
                disabled={pendingId !== null}
              >
                {pendingId === admin.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              </IconButton>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
