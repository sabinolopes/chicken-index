import Link from "next/link";
import { Suspense } from "react";
import { Camera } from "lucide-react";
import { RecentPrices, RecentPricesSkeleton } from "@/components/blocks/recent-prices";
import { SettingsForm, SettingsFormSkeleton } from "@/components/blocks/settings-form";
import { requireAdmin } from "@/modules/auth/session";
import { listFormSuggestions, listRecentPrices } from "@/modules/prices/queries";
import { getSettings } from "@/modules/settings/queries";

const RECENT_LIMIT = 30;

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

      {/* Cada bloco carrega e aparece por conta própria. */}
      <Suspense fallback={<RecentPricesSkeleton />}>
        <LatestPrices />
      </Suspense>
      <Suspense fallback={<SettingsFormSkeleton />}>
        <Wages />
      </Suspense>
    </div>
  );
}

async function LatestPrices() {
  await requireAdmin();
  const [{ prices, total }, suggestions] = await Promise.all([listRecentPrices(RECENT_LIMIT), listFormSuggestions()]);
  return <RecentPrices prices={prices} total={total} suggestions={suggestions} />;
}

async function Wages() {
  await requireAdmin();
  return <SettingsForm settings={await getSettings()} />;
}
