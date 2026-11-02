import { Dashboard } from "@/components/dashboard/dashboard";
import { getDashboardData } from "@/lib/data";

// Sem queries por visitante: `getDashboardData` é `'use cache'` com revalidação de 1h
// (ver lib/data.ts) e é invalidado sob demanda quando o admin cadastra um preço.
export default async function Home() {
  const data = await getDashboardData();
  return <Dashboard data={data} />;
}
