import { Suspense } from "react";
import { AdminList, AdminListSkeleton, InviteAdminForm } from "@/components/blocks/admin-users";
import { listAdmins } from "@/modules/admins/queries";
import { requireAdmin } from "@/modules/auth/session";

export default function AdminUsersPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Admins</h1>
      <p className="mb-5 text-sm text-muted">
        Só quem está aqui pode cadastrar preços. Novos admins entram por convite: recebem um e-mail e definem a própria
        senha.
      </p>
      <div className="space-y-6">
        {/* O convite não depende de dados: aparece na hora (o proxy e a action já exigem admin). */}
        <InviteAdminForm />
        <Suspense fallback={<AdminListSkeleton />}>
          <CurrentAdmins />
        </Suspense>
      </div>
    </>
  );
}

async function CurrentAdmins() {
  const currentAdmin = await requireAdmin();
  const admins = await listAdmins();
  return <AdminList admins={admins} currentUserId={currentAdmin.id} />;
}
