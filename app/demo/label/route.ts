import type { NextRequest } from "next/server";

/**
 * Gera a "foto" SVG de uma etiqueta de gôndola para os registros do Modo Demo.
 * Em produção, `photo_url` aponta para o .webp real no bucket `price-photos`.
 */

function esc(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const brand = (q.get("brand") ?? "Marca").slice(0, 20);
  const price = Number(q.get("price") ?? "0");
  const market = (q.get("market") ?? "Mercado").slice(0, 40);
  const type = q.get("type") === "congelado" ? "CONGELADO" : "RESFRIADO";
  const kind = q.get("kind");
  const promoBadge =
    kind === "oferta"
      ? `<g transform="translate(905 375) rotate(12)"><circle r="92" fill="#d7262e" stroke="#fff" stroke-width="6"/><text y="-8" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="38" font-weight="900" fill="#fff">OFERTA</text><text y="32" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#ffe14d">IMPERDÍVEL</text></g>`
      : kind === "clube"
        ? `<g transform="translate(600 330)"><rect x="-410" y="-26" width="820" height="52" rx="8" fill="#1d4ed8"/><text y="10" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#fff">PREÇO CLUBE · EXCLUSIVO PARA CADASTRADOS</text></g>`
        : "";
  const date = (q.get("date") ?? "").slice(0, 10);
  const seed = hash(q.get("seed") ?? brand + price);

  const tilt = ((seed % 70) - 35) / 10; // -3.5° .. +3.5°
  const glare = 20 + (seed % 60);
  const [reais, centavos] = price.toFixed(2).split(".");
  const [y, m, d] = date.split("-");
  const tagColor = brand === "Sadia" ? "#ffe14d" : brand === "Seara" ? "#fff3a8" : "#ffd84a";

  let bars = "";
  let x = 0;
  for (let i = 0; x < 230; i++) {
    const w = 1 + ((seed >> (i % 24)) & 3);
    if (i % 2 === 0) bars += `<rect x="${x}" y="0" width="${w}" height="46" fill="#111"/>`;
    x += w + 1;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="1200" height="900">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#cfd8de"/><stop offset="0.5" stop-color="#e9eef1"/><stop offset="1" stop-color="#b7c3ca"/>
    </linearGradient>
    <linearGradient id="glare" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="shadow"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-opacity="0.3"/></filter>
  </defs>
  <rect width="1200" height="900" fill="url(#bg)"/>
  <g filter="url(#blur)" opacity="0.85">
    <rect x="60" y="40" width="330" height="260" rx="24" fill="#f4d6c4"/>
    <rect x="430" y="60" width="330" height="240" rx="24" fill="#f1cdb8"/>
    <rect x="800" y="30" width="340" height="270" rx="24" fill="#f6dccd"/>
    <rect x="0" y="330" width="1200" height="30" fill="#8d9aa3"/>
    <rect x="80" y="700" width="300" height="200" rx="24" fill="#ecc3ad"/>
    <rect x="820" y="690" width="320" height="210" rx="24" fill="#f3d2bf"/>
  </g>
  <g transform="rotate(${tilt} 600 520)" filter="url(#shadow)">
    <rect x="190" y="360" width="820" height="330" rx="10" fill="${tagColor}" stroke="#c9a400" stroke-width="3"/>
    <rect x="190" y="360" width="820" height="62" rx="10" fill="#d7262e"/>
    <rect x="190" y="400" width="820" height="22" fill="#d7262e"/>
    <text x="214" y="404" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="#fff">${esc(market.toUpperCase())}</text>
    <text x="214" y="470" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="#1a1a1a">FILÉ DE PEITO DE FRANGO ${type}</text>
    <text x="214" y="512" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#333">${esc(brand.toUpperCase())} · BANDEJA · PREÇO POR KG</text>
    <text x="214" y="620" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="700" fill="#1a1a1a">R$/kg</text>
    <text x="640" y="650" text-anchor="end" font-family="Arial Black, Arial, sans-serif" font-size="150" font-weight="900" fill="#111">${reais}</text>
    <text x="650" y="580" font-family="Arial Black, Arial, sans-serif" font-size="76" font-weight="900" fill="#111">,${centavos}</text>
    <g transform="translate(760 560)">${bars}</g>
    <text x="760" y="640" font-family="monospace" font-size="20" fill="#222">789${String(seed).slice(0, 10)}</text>
    <text x="760" y="672" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#333">Vál. ${d}/${m}/${y}</text>
    ${promoBadge}
  </g>
  <rect x="${glare * 10}" y="0" width="240" height="900" fill="url(#glare)" transform="skewX(-18)"/>
  <rect width="1200" height="900" fill="#000" opacity="0.04"/>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
