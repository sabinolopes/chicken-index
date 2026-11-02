import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { listAdmins } from "@/lib/admin-users";
import { AdminList, InviteAdminForm } from "@/components/admin/admin-users";

export default function AdminUsersPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Admins</h1>
      <p className="mb-5 text-sm text-muted">
        Só quem está aqui pode cadastrar preços. Novos admins entram por convite: recebem um e-mail e definem a própria
        senha.
      </p>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-stone-200/70" aria-hidden />}>
        <AdminUsers />
      </Suspense>
    </>
  );
}

async function AdminUsers() {
  const me = await requireAdmin();
  const admins = await listAdmins();
  return (
    <div className="space-y-6">
      <InviteAdminForm />
      <AdminList admins={admins} currentUserId={me.id} />
    </div>
  );
}
