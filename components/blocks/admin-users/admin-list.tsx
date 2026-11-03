"use client";

import { useState, useTransition } from "react";
import { Clock, Link2, Loader2, Mail, Trash2 } from "lucide-react";
import { Alert } from "@/components/elements/alert";
import { IconButton } from "@/components/elements/button";
import { Panel, PanelHeader } from "@/components/elements/panel";
import { formatDateTime } from "@/lib/format";
import { removeAdmin, renewInviteLink } from "@/modules/admins/actions";
import type { AdminListItem } from "@/modules/admins/service";
import { InviteLinkBox } from "./invite-link-box";

const formatLastSignIn = (lastSignInAt: string | null) => (lastSignInAt ? formatDateTime(lastSignInAt) : "—");

/** Pergunta de confirmação: convite pendente é só cancelado; admin ativo perde a conta. */
function removalQuestion(admin: AdminListItem) {
  if (admin.pending) return `Cancelar o convite de ${admin.email}?`;
  const who = admin.name ? `${admin.name} (${admin.email})` : admin.email;
  return `Remover o acesso de admin de ${who}? A conta será apagada.`;
}

type RenewedLink = { adminId: string; message: string; link: string };

export function AdminList({ admins, currentUserId }: { admins: AdminListItem[]; currentUserId: string }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renewed, setRenewed] = useState<RenewedLink | null>(null);
  const [, startTransition] = useTransition();

  /** Roda uma ação na linha do admin, com indicador de carregamento e erro no topo da lista. */
  function runForRow(admin: AdminListItem, task: () => Promise<void>) {
    setError(null);
    setPendingId(admin.id);
    startTransition(async () => {
      await task();
      setPendingId(null);
    });
  }

  function remove(admin: AdminListItem) {
    if (!confirm(removalQuestion(admin))) return;
    runForRow(admin, async () => {
      const result = await removeAdmin(admin.id);
      if (!result.ok) setError(result.error);
    });
  }

  function renewLink(admin: AdminListItem) {
    runForRow(admin, async () => {
      const result = await renewInviteLink(admin.email);
      if (!result.ok) return setError(result.error);
      setRenewed({ adminId: admin.id, message: result.message, link: result.link });
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
          <li key={admin.id} className="space-y-3 px-4 py-3">
            <AdminRow
              admin={admin}
              isCurrentUser={admin.id === currentUserId}
              busy={pendingId === admin.id}
              disabled={pendingId !== null}
              onRemove={() => remove(admin)}
              onRenewLink={() => renewLink(admin)}
            />
            {renewed?.adminId === admin.id && <InviteLinkBox message={renewed.message} link={renewed.link} />}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

interface AdminRowProps {
  admin: AdminListItem;
  isCurrentUser: boolean;
  /** Esta linha está com uma ação em andamento. */
  busy: boolean;
  /** Alguma linha está ocupada: os botões esperam. */
  disabled: boolean;
  onRemove: () => void;
  onRenewLink: () => void;
}

function AdminRow({ admin, isCurrentUser, busy, disabled, onRemove, onRenewLink }: AdminRowProps) {
  return (
    <div className="flex items-center gap-3">
      <Mail className="size-4 shrink-0 text-subtle" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {admin.name ?? admin.email} {isCurrentUser && <span className="text-sm font-normal text-subtle">(você)</span>}
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
      {busy && <Loader2 className="size-4 animate-spin text-subtle" aria-label="Processando" />}
      {admin.pending && (
        <IconButton label={`Gerar novo link de convite para ${admin.email}`} onClick={onRenewLink} disabled={disabled}>
          <Link2 className="size-4" />
        </IconButton>
      )}
      {!isCurrentUser && (
        <IconButton
          tone="danger"
          label={admin.pending ? `Cancelar convite de ${admin.email}` : `Remover ${admin.name ?? admin.email}`}
          onClick={onRemove}
          disabled={disabled}
        >
          <Trash2 className="size-4" />
        </IconButton>
      )}
    </div>
  );
}
