import type { Metadata } from "next";
import { Drumstick } from "lucide-react";
import { SetPasswordForm } from "@/components/admin/set-password-form";

export const metadata: Metadata = { title: "Definir senha · Índice do Peito de Frango", robots: { index: false } };

// Fica fora de /admin de propósito: o proxy redirecionaria para o login antes de a
// página ler os tokens do convite (que chegam no fragmento # da URL).
export default function SetPasswordPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Drumstick className="mx-auto size-8 text-accent" aria-hidden />
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Definir senha</h1>
          <p className="mt-1 text-sm text-muted">Acesso de admin · Índice do Peito de Frango</p>
        </div>
        <SetPasswordForm />
      </div>
    </main>
  );
}
