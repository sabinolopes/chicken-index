"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { Alert } from "@/components/elements/alert";
import { Button } from "@/components/elements/button";
import { Field, TextInput } from "@/components/elements/field";
import { signIn } from "@/modules/auth/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, null);

  return (
    <form action={action} className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <Field htmlFor="email" label="E-mail">
        <TextInput id="email" name="email" type="email" autoComplete="username" required />
      </Field>
      <Field htmlFor="password" label="Senha">
        <TextInput id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>

      {state && !state.ok && <Alert tone="error">{state.error}</Alert>}

      <Button type="submit" variant="primary" disabled={pending}>
        <LogIn className="size-5" aria-hidden />
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
