import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { getAdminData } from "@/lib/admin-data";
import { NewPriceForm } from "@/components/admin/new-price-form";

export default function NewPricePage() {
  return (
    <>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Novo preço</h1>
      <p className="mb-5 text-sm text-muted">
        Fotografe a etiqueta: o hash e o EXIF são lidos do arquivo original antes da compressão.
      </p>
      <Suspense fallback={<FormSkeleton />}>
        <NewPriceLoader />
      </Suspense>
    </>
  );
}

async function NewPriceLoader() {
  const admin = await requireAdmin();
  const { suggestions } = await getAdminData(1);
  return <NewPriceForm suggestions={suggestions} demo={admin.demo} />;
}

function FormSkeleton() {
  return (
    <div className="space-y-5" aria-hidden>
      <div className="h-40 animate-pulse rounded-xl bg-stone-200/70" />
      <div className="h-64 animate-pulse rounded-xl bg-stone-200/70" />
    </div>
  );
}
