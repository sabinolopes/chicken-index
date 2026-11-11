import type { Metadata } from "next";
import { Widget } from "@/components/pages/widget";
import { getDashboardData } from "@/modules/dashboard/queries";
import { linkPreview } from "@/modules/dashboard/link-preview";
import { computeKpis } from "@/modules/dashboard/stats";

// Widget para outros sites (iframe). Mesmo cache da página inicial: muitos acessos
// no site parceiro não viram consultas ao banco. É a única página que pode ser
// exibida dentro de outro site (ver headers em next.config.ts).
export const metadata: Metadata = { title: "Frangômetro · widget", robots: { index: false } };

export default async function WidgetPage() {
  const data = await getDashboardData();
  return <Widget preview={linkPreview(computeKpis(data.prices, data.settings))} />;
}
