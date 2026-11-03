"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, TriangleAlert } from "lucide-react";
import { Alert } from "@/components/elements/alert";
import { Button } from "@/components/elements/button";
import { Field, TextInput } from "@/components/elements/field";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { sessionFromLink, type LinkStatus } from "./session-from-link";

const MIN_LENGTH = 8;

/** Erro de digitação antes de chamar o servidor; null quando as senhas servem. */
export function passwordError(password: string, confirmation: string) {
  if (password.length < MIN_LENGTH) return `A senha precisa ter pelo menos ${MIN_LENGTH} caracteres.`;
  if (password !== confirmation) return "As senhas não conferem.";
  return null;
}

export function SetPasswordForm() {
  const [status, setStatus] = useState<LinkStatus>({ kind: "checking" });
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
    const typingError = passwordError(password, confirmation);
    setError(typingError);
    if (typingError) return;

    setSaving(true);
    const { error: updateError } = await createBrowserSupabase().auth.updateUser({ password });
    if (updateError) {
      setSaving(false);
      setError(/different from the old/i.test(updateError.message) ? "Use uma senha diferente da anterior." : updateError.message);
      return;
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
      <Field htmlFor="new-password" label="Nova senha">
        <TextInput
          id="new-password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_LENGTH}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>
      <Field htmlFor="confirm-password" label="Repita a senha">
        <TextInput
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_LENGTH}
          required
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
        />
      </Field>

      {error && <Alert tone="error">{error}</Alert>}

      <Button type="submit" variant="primary" disabled={saving}>
        {saving ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <KeyRound className="size-5" aria-hidden />}
        {saving ? "Salvando…" : "Salvar senha e entrar"}
      </Button>
    </form>
  );
}
