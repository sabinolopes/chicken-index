import { Dashboard } from "@/components/pages/dashboard";
import { getDashboardData } from "@/modules/dashboard/queries";

// Sem queries por visitante: `getDashboardData` é `'use cache'` com revalidação de 1h
// (ver modules/dashboard/queries.ts) e é invalidado sob demanda quando o admin cadastra um preço.
export default async function Home() {
  const data = await getDashboardData();
  return <Dashboard data={data} />;
}
