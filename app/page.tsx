import { Dashboard } from "@/components/pages/dashboard";
import { getDashboardData } from "@/modules/dashboard/queries";
import { getOfficialInflation } from "@/modules/inflation/queries";

// Sem queries por visitante: `getDashboardData` é `'use cache'` com revalidação de 1h
// (ver modules/dashboard/queries.ts) e é invalidado sob demanda quando o admin cadastra um preço.
// O IPCA do IBGE fica em cache por um dia (modules/inflation/queries.ts).
export default async function Home() {
  const [data, inflation] = await Promise.all([getDashboardData(), getOfficialInflation()]);
  return <Dashboard data={data} inflation={inflation} />;
}
