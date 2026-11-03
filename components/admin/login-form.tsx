"use client";

import { useActionState } from "react";
import { LogIn, TriangleAlert } from "lucide-react";
import { signIn } from "@/modules/auth/actions";
import { inputClass, labelClass, primaryButtonClass } from "./ui";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, null);

  return (
    <form action={action} className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <div>
        <label htmlFor="email" className={labelClass}>
          E-mail
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>
          Senha
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </div>

      {state && !state.ok && (
        <p role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-sm text-red-800">
          <TriangleAlert className="size-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={primaryButtonClass}>
        <LogIn className="size-5" aria-hidden />
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
