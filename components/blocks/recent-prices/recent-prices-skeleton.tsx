import { Panel } from "@/components/elements/panel";
import { LoadingRegion, Skeleton } from "@/components/elements/skeleton";

const ROWS = 4;

/** Mesmo formato da lista de últimos cadastros: cabeçalho e linhas com miniatura. */
export function RecentPricesSkeleton() {
  return (
    <LoadingRegion label="Carregando últimos cadastros…">
      <Panel padding="none">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-16" />
        </div>
        <ul className="divide-y divide-border">
          {Array.from({ length: ROWS }, (_, row) => (
            <li key={row} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="size-12 shrink-0 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </LoadingRegion>
  );
}
