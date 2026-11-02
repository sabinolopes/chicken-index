import Link from "next/link";
import { Suspense } from "react";
import { Camera, FlaskConical } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminData } from "@/lib/admin-data";
import { RecentPrices } from "@/components/admin/recent-prices";
import { SettingsForm } from "@/components/admin/settings-form";

export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/novo"
        className="flex items-center justify-center gap-3 rounded-2xl bg-foreground px-5 py-5 text-lg font-semibold text-white shadow-sm hover:bg-stone-700"
      >
        <Camera className="size-6" aria-hidden />
        Cadastrar novo preço
      </Link>

      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-stone-200/70" aria-hidden />}>
        <AdminHome />
      </Suspense>
    </div>
  );
}

async function AdminHome() {
  const admin = await requireAdmin();
  const { prices, total, settings } = await getAdminData(30);

  return (
    <>
      {admin.demo && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <strong>Modo Demo:</strong> o fluxo de upload funciona por completo (hash, EXIF, compressão e validação), mas
            nada é gravado. Exclusão e edição de salários ficam desativadas.
          </span>
        </p>
      )}
      <RecentPrices prices={prices} total={total} demo={admin.demo} />
      <SettingsForm settings={settings} demo={admin.demo} />
    </>
  );
}
