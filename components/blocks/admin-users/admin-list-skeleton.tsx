import { Panel } from "@/components/elements/panel";
import { LoadingRegion, Skeleton } from "@/components/elements/skeleton";

const ROWS = 2;

/** Mesmo formato da lista de admins: cabeçalho com contagem e linhas de e-mail. */
export function AdminListSkeleton() {
  return (
    <LoadingRegion label="Carregando admins…">
      <Panel padding="none">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-4" />
        </div>
        <ul className="divide-y divide-border">
          {Array.from({ length: ROWS }, (_, row) => (
            <li key={row} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="size-4 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-3 w-40" />
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </LoadingRegion>
  );
}
