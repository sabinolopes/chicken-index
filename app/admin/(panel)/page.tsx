import Link from "next/link";
import { Suspense } from "react";
import { Camera } from "lucide-react";
import { RecentPrices, RecentPricesSkeleton, shownCount } from "@/components/blocks/recent-prices";
import { SettingsForm, SettingsFormSkeleton } from "@/components/blocks/settings-form";
import { requireAdmin } from "@/modules/auth/session";
import { listFormSuggestions, listRecentPrices } from "@/modules/prices/queries";
import { getSettings } from "@/modules/settings/queries";

type UrlQuery = PageProps<"/admin">["searchParams"];

export default function AdminHomePage({ searchParams }: PageProps<"/admin">) {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/novo"
        className="flex items-center justify-center gap-3 rounded-2xl bg-foreground px-5 py-5 text-lg font-semibold text-white shadow-sm hover:bg-stone-700"
      >
        <Camera className="size-6" aria-hidden />
        Cadastrar novo preço
      </Link>

      {/* Cada bloco carrega e aparece por conta própria. Salários ficam no alto, compactos:
          a lista cresce com o tempo e não pode empurrá-los para o fim da página. */}
      <Suspense fallback={<SettingsFormSkeleton />}>
        <Wages />
      </Suspense>
      <Suspense fallback={<RecentPricesSkeleton />}>
        <LatestPrices searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function LatestPrices({ searchParams }: { searchParams: UrlQuery }) {
  await requireAdmin();
  const shown = shownCount((await searchParams).mostrar);
  const [{ prices, total }, suggestions] = await Promise.all([listRecentPrices(shown), listFormSuggestions()]);
  return <RecentPrices prices={prices} total={total} suggestions={suggestions} />;
}

async function Wages() {
  await requireAdmin();
  return <SettingsForm settings={await getSettings()} />;
}
