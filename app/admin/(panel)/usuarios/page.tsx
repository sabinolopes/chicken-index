import { Suspense } from "react";
import { requireAdmin } from "@/modules/auth/session";
import { listAdmins } from "@/modules/admins/queries";
import { AdminList, InviteAdminForm } from "@/components/blocks/admin-users";
import { Skeleton } from "@/components/elements/skeleton";

export default function AdminUsersPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Admins</h1>
      <p className="mb-5 text-sm text-muted">
        Só quem está aqui pode cadastrar preços. Novos admins entram por convite: recebem um e-mail e definem a própria
        senha.
      </p>
      <Suspense fallback={<Skeleton className="h-64" />}>
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
