"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, TriangleAlert } from "lucide-react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { inputClass, labelClass, primaryButtonClass } from "./ui";

type Status = { kind: "checking" } | { kind: "ready"; email: string } | { kind: "invalid"; message: string };

const MIN_LENGTH = 8;

/** Abre a sessão a partir do link do e-mail (convite), em qualquer dos formatos que o Supabase usa. */
async function sessionFromLink(): Promise<Status> {
  const supabase = createBrowserSupabase();
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const query = new URLSearchParams(window.location.search);

  const linkError = hash.get("error_description") ?? query.get("error_description");
  if (linkError) {
    return { kind: "invalid", message: /expired|invalid/i.test(linkError) ? "Este link expirou ou já foi usado." : linkError };
  }

  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  const tokenHash = query.get("token_hash");
  const type = query.get("type") as EmailOtpType | null;
  const code = query.get("code");

  let error: { message: string } | null = null;
  if (accessToken && refreshToken) {
    ({ error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }));
  } else if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type }));
  } else if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  }
  // Tira os tokens da barra de endereço (e do histórico).
  window.history.replaceState(null, "", window.location.pathname);
  if (error) return { kind: "invalid", message: "Este link expirou ou já foi usado." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { kind: "invalid", message: "Abra esta página pelo link do e-mail de convite." };
  return { kind: "ready", email: user.email ?? "" };
}

export function SetPasswordForm() {
  const [status, setStatus] = useState<Status>({ kind: "checking" });
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    sessionFromLink().then(setStatus);
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < MIN_LENGTH) return setError(`A senha precisa ter pelo menos ${MIN_LENGTH} caracteres.`);
    if (password !== confirmation) return setError("As senhas não conferem.");

    setSaving(true);
    const { error: updateError } = await createBrowserSupabase().auth.updateUser({ password });
    if (updateError) {
      setSaving(false);
      return setError(
        /different from the old/i.test(updateError.message) ? "Use uma senha diferente da anterior." : updateError.message,
      );
    }
    // A sessão nova já está nos cookies, que vão junto na navegação até o proxy.
    router.replace("/admin");
  }

  if (status.kind === "checking") {
    return (
      <p className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface p-6 text-sm text-muted" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Validando o link…
      </p>
    );
  }

  if (status.kind === "invalid") {
    return (
      <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="flex items-start gap-2">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {status.message}
        </p>
        <p>Peça a um admin para enviar um novo convite pela página Admins do painel.</p>
        <Link href="/admin/login" className="inline-block font-medium underline underline-offset-2">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <p className="text-sm text-muted">
        Conta: <strong className="text-foreground">{status.email}</strong>
      </p>
      <input type="email" name="username" autoComplete="username" value={status.email} readOnly hidden />
      <div>
        <label htmlFor="new-password" className={labelClass}>
          Nova senha
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_LENGTH}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className={labelClass}>
          Repita a senha
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_LENGTH}
          required
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          className={inputClass}
        />
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-sm text-red-800">
          <TriangleAlert className="size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <button type="submit" disabled={saving} className={primaryButtonClass}>
        {saving ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <KeyRound className="size-5" aria-hidden />}
        {saving ? "Salvando…" : "Salvar senha e entrar"}
      </button>
    </form>
  );
}
