import { Panel } from "@/components/elements/panel";
import { LoadingRegion, Skeleton } from "@/components/elements/skeleton";

/** Mesmo formato do cartão fechado de salários: título, valores, data e o botão "Editar". */
export function SettingsFormSkeleton() {
  return (
    <LoadingRegion label="Carregando salários…">
      <Panel>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64 max-w-full" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
      </Panel>
    </LoadingRegion>
  );
}
