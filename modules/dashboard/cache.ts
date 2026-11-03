import { revalidatePath, updateTag } from "next/cache";

export const DASHBOARD_CACHE_TAG = "chicken-prices";

/** Invalida o cache da home logo após uma alteração do admin (preço ou salários). */
export function refreshDashboard() {
  updateTag(DASHBOARD_CACHE_TAG);
  revalidatePath("/");
}
