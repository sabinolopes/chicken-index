import { AVG_KEY, BRAND_COLORS, PROMO_KEY } from "./chart-data";

/** Legenda sempre visível: a cor nunca é a única forma de identificar a série. */
export function ChartLegend({ brands, hasPromo }: { brands: readonly string[]; hasPromo: boolean }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted" aria-label="Legenda">
      <LegendItem color="var(--series-avg)" label={AVG_KEY} thick />
      {brands.map((brand) => (
        <LegendItem key={brand} color={BRAND_COLORS[brand]} label={brand} />
      ))}
      {hasPromo && <LegendItem color="var(--series-promo)" label={PROMO_KEY} dashed />}
    </ul>
  );
}

function LegendItem({ color, label, thick = false, dashed = false }: { color: string; label: string; thick?: boolean; dashed?: boolean }) {
  const line = dashed
    ? { backgroundImage: `linear-gradient(to right, ${color} 60%, transparent 60%)`, backgroundSize: "6px 100%" }
    : { background: color };
  return (
    <li className="flex items-center gap-1.5">
      <span className={`inline-block w-4 ${thick ? "h-[3px]" : "h-0.5"} ${dashed ? "" : "rounded-full"}`} style={line} aria-hidden />
      <span className={thick ? "font-medium text-foreground" : ""}>{label}</span>
    </li>
  );
}
