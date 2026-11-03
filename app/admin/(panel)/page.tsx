import Link from "next/link";
import { Suspense } from "react";
import { Camera } from "lucide-react";
import { requireAdmin } from "@/modules/auth/session";
import { listRecentPrices } from "@/modules/prices/queries";
import { getSettings } from "@/modules/settings/queries";
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
  await requireAdmin();
  const [{ prices, total }, settings] = await Promise.all([listRecentPrices(30), getSettings()]);

  return (
    <>
      <RecentPrices prices={prices} total={total} />
      <SettingsForm settings={settings} />
    </>
  );
}
