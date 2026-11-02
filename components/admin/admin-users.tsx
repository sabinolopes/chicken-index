"use client";

import { useActionState, useState, useTransition } from "react";
import { CheckCircle2, Clock, Loader2, Mail, Send, Trash2, TriangleAlert } from "lucide-react";
import { inviteAdmin, removeAdmin } from "@/app/admin/actions";
import type { AdminListItem } from "@/lib/admin-users";
import { formatDateTime } from "@/lib/format";
import { inputClass, labelClass, secondaryButtonClass } from "./ui";

export function InviteAdminForm() {
  const [state, action, pending] = useActionState(inviteAdmin, null);

  return (
    <section aria-labelledby="invite-title" className="rounded-xl border border-border bg-surface p-4">
      <h2 id="invite-title" className="font-semibold">
        Convidar admin
      </h2>
      <form action={action} className="mt-3 space-y-3">
        <div>
          <label htmlFor="invite-email" className={labelClass}>
            E-mail
          </label>
          <input id="invite-email" name="email" type="email" required autoComplete="off" placeholder="nome@exemplo.com" className={inputClass} />
        </div>

        {state && (
          <p
            role="status"
            className={`flex items-start gap-2 rounded-lg p-2.5 text-sm ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}
          >
            {state.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden /> : <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />}
            {state.ok ? state.message : state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className={secondaryButtonClass}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
          {pending ? "Enviando…" : "Enviar convite"}
        </button>
      </form>
    </section>
  );
}

export function AdminList({ admins, currentUserId }: { admins: AdminListItem[]; currentUserId: string }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function remove(a: AdminListItem) {
    const what = a.pending ? `Cancelar o convite de ${a.email}?` : `Remover o acesso de admin de ${a.email}? A conta será apagada.`;
    if (!confirm(what)) return;
    setError(null);
    setPendingId(a.id);
    startTransition(async () => {
      const res = await removeAdmin(a.id);
      if (!res.ok) setError(res.error);
      setPendingId(null);
    });
  }

  return (
    <section aria-labelledby="admins-title" className="rounded-xl border border-border bg-surface">
      <div className="flex items-baseline justify-between gap-2 border-b border-border px-4 py-3">
        <h2 id="admins-title" className="font-semibold">
          Admins atuais
        </h2>
        <span className="text-sm text-subtle tabular">{admins.length}</span>
      </div>

      {error && (
        <p role="alert" className="m-3 flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-sm text-red-800">
          <TriangleAlert className="size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <ul className="divide-y divide-border">
        {admins.map((a) => {
          const isMe = a.id === currentUserId;
          return (
            <li key={a.id} className="flex items-center gap-3 px-4 py-3">
              <Mail className="size-4 shrink-0 text-subtle" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {a.email} {isMe && <span className="text-sm font-normal text-subtle">(você)</span>}
                </p>
                <p className="text-xs text-subtle">
                  {a.pending ? (
                    <span className="inline-flex items-center gap-1 text-amber-800">
                      <Clock className="size-3.5" aria-hidden />
                      Convite pendente{a.invitedAt && ` · enviado em ${formatDateTime(a.invitedAt)}`}
                    </span>
                  ) : (
                    `Último acesso: ${a.lastSignInAt ? formatDateTime(a.lastSignInAt) : "—"}`
                  )}
                </p>
              </div>
              {!isMe && (
                <button
                  type="button"
                  onClick={() => remove(a)}
                  disabled={pendingId !== null}
                  aria-label={a.pending ? `Cancelar convite de ${a.email}` : `Remover ${a.email}`}
                  title={a.pending ? "Cancelar convite" : "Remover acesso"}
                  className="rounded-lg p-2 text-subtle hover:bg-red-50 hover:text-red-700 disabled:opacity-30"
                >
                  {pendingId === a.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
