import type { Metadata } from "next";
import Link from "next/link";
import { Drumstick } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Entrar · Admin · Índice do Peito de Frango", robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Drumstick className="mx-auto size-8 text-accent" aria-hidden />
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Área do Admin</h1>
          <p className="mt-1 text-sm text-muted">Índice do Peito de Frango</p>
        </div>

        {isSupabaseConfigured() ? (
          <LoginForm />
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <p>
              <strong>Modo Demo:</strong> o login fica desativado enquanto o Supabase não estiver configurado no{" "}
              <code className="font-mono text-xs">.env.local</code>.
            </p>
            <Link
              href="/admin"
              className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-foreground px-4 py-2.5 font-semibold text-white"
            >
              Entrar no painel demo
            </Link>
          </div>
        )}

        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-muted hover:text-foreground hover:underline">
            ← Voltar ao dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}
