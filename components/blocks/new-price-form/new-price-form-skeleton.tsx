import { LoadingRegion, Skeleton } from "@/components/elements/skeleton";

const SECTIONS = [
  { legend: "w-32", body: "h-28" },
  { legend: "w-36", body: "h-56" },
  { legend: "w-28", body: "h-44" },
];

/** As três etapas do cadastro, enquanto as sugestões de mercado carregam. */
export function NewPriceFormSkeleton() {
  return (
    <LoadingRegion label="Carregando formulário…" className="space-y-5">
      {SECTIONS.map(({ legend, body }) => (
        <div key={legend + body} className="rounded-xl border border-border bg-surface px-4 pb-4 pt-3">
          <Skeleton className={`h-4 ${legend}`} />
          <Skeleton className={`mt-3 ${body}`} />
        </div>
      ))}
      <Skeleton className="h-14 rounded-xl" />
    </LoadingRegion>
  );
}
