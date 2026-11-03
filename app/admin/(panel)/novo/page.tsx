import { Suspense } from "react";
import { NewPriceForm, NewPriceFormSkeleton } from "@/components/blocks/new-price-form";
import { requireAdmin } from "@/modules/auth/session";
import { listMarketSuggestions } from "@/modules/prices/queries";

export default function NewPricePage() {
  return (
    <>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Novo preço</h1>
      <p className="mb-5 text-sm text-muted">Fotografe a etiqueta: o hash e o EXIF são lidos do arquivo original antes da compressão.</p>
      <Suspense fallback={<NewPriceFormSkeleton />}>
        <NewPriceLoader />
      </Suspense>
    </>
  );
}

async function NewPriceLoader() {
  await requireAdmin();
  const suggestions = await listMarketSuggestions();
  return <NewPriceForm suggestions={suggestions} />;
}
