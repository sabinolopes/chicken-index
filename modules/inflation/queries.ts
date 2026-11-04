import { cacheLife } from "next/cache";
import { fetchIpca } from "./ibge";
import type { OfficialInflation } from "./types";

/**
 * IPCA para o dashboard, em cache por um dia (o IBGE publica uma vez por mês). Se o IBGE
 * falhar, devolve null para o painel dizer que está indisponível, e guarda essa falha
 * só por alguns minutos para tentar de novo logo.
 */
export async function getOfficialInflation(): Promise<OfficialInflation | null> {
  "use cache";
  try {
    const inflation = await fetchIpca();
    cacheLife({ stale: 3600, revalidate: 86_400, expire: 604_800 });
    return inflation;
  } catch {
    cacheLife({ stale: 60, revalidate: 300, expire: 600 });
    return null;
  }
}
