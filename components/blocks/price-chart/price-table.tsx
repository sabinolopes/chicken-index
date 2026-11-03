import { formatBRL } from "@/lib/format";
import type { WeeklyPoint } from "@/modules/dashboard/stats";
import { AVG_KEY, brandLabel, type ChartRow } from "./chart-data";

interface PriceTableProps {
  rows: ChartRow[];
  series: WeeklyPoint[];
  promoSeries: WeeklyPoint[];
  brands: readonly string[];
}

const priceOrDash = (value: number | undefined) => (value === undefined ? "—" : formatBRL(value));

/** Os mesmos dados do gráfico em tabela (acessível a leitor de tela e fácil de conferir). */
export function PriceTable({ rows, series, promoSeries, brands }: PriceTableProps) {
  const regularByWeek = new Map(series.map((point) => [point.week, point]));
  const promoByWeek = new Map(promoSeries.map((point) => [point.week, point]));
  const hasPromo = promoSeries.length > 0;

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm tabular">
        <thead>
          <tr className="border-b border-border text-left text-muted">
            <th className="py-2 pr-4 font-medium">Semana</th>
            <th className="py-2 pr-4 text-right font-medium">{AVG_KEY}</th>
            {brands.map((brand) => (
              <th key={brand} className="py-2 pr-4 text-right font-medium">
                {brandLabel(brand)}
              </th>
            ))}
            {hasPromo && <th className="py-2 pr-4 text-right font-medium">Promoções</th>}
            <th className="py-2 text-right font-medium">Etiquetas</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const regular = regularByWeek.get(row.week);
            const promo = promoByWeek.get(row.week);
            return (
              <tr key={row.week} className="border-b border-border/60">
                <td className="py-2 pr-4">{row.label}</td>
                <td className="py-2 pr-4 text-right font-semibold">{priceOrDash(regular?.average)}</td>
                {brands.map((brand) => (
                  <td key={brand} className="py-2 pr-4 text-right">
                    {priceOrDash(regular?.byBrand[brand])}
                  </td>
                ))}
                {hasPromo && <td className="py-2 pr-4 text-right">{promo ? `${formatBRL(promo.average)} (${promo.count})` : "—"}</td>}
                <td className="py-2 text-right text-muted">{(regular?.count ?? 0) + (promo?.count ?? 0)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
