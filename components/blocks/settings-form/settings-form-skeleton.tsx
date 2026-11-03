import { Panel } from "@/components/elements/panel";
import { LoadingRegion, Skeleton } from "@/components/elements/skeleton";

/** Mesmo formato do formulário de salários: título, dois campos e o botão. */
export function SettingsFormSkeleton() {
  return (
    <LoadingRegion label="Carregando salários…">
      <Panel>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          {["min", "avg"].map((field) => (
            <div key={field} className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-12" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-3 h-9 w-36" />
      </Panel>
    </LoadingRegion>
  );
}
