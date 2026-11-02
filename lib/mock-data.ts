import type { ChickenPrice, EconomicSettings, StateType } from "./types";

/**
 * Dados de demonstração: 8 semanas de coletas (set–out/2026) em 4 mercados fictícios,
 * marcas Sadia, Seara e Perdigão. Gerados com PRNG determinístico para que o cache
 * e a renderização sejam estáveis entre requisições.
 */

const FIRST_WEEK = "2026-09-12"; // sábado da 1ª semana
const WEEKS = 8;

const MARKETS: {
  name: string;
  city: string;
  state: string;
  regional: number;
  stateType: StateType;
}[] = [
  { name: "Supermercado Bom Preço", city: "São Paulo", state: "SP", regional: 1.04, stateType: "resfriado" },
  { name: "Mercado Santa Luzia", city: "Belo Horizonte", state: "MG", regional: 0.98, stateType: "resfriado" },
  { name: "Atacarejo Pinheiral", city: "Curitiba", state: "PR", regional: 0.95, stateType: "resfriado" },
  { name: "Hiper Economia Nordeste", city: "Recife", state: "PE", regional: 1.02, stateType: "congelado" },
];

const BRAND_BASE: Record<string, number> = {
  Sadia: 21.9,
  Seara: 20.5,
  Perdigão: 21.3,
};
const BRAND_ORDER = Object.keys(BRAND_BASE);

const DEVICES = [
  "Apple iPhone 13",
  "Samsung SM-A546E",
  "Motorola moto g84 5G",
  "Xiaomi Redmi Note 13",
  "Apple iPhone 15 Pro",
];

// Inflação semanal acumulada (média ~1,1%/semana, com uma semana de alívio).
const WEEKLY_TREND = [1, 1.012, 1.021, 1.018, 1.034, 1.049, 1.061, 1.083];

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Preços de gôndola terminam em ,x9 / ,99. */
function shelfPrice(value: number) {
  return Math.round((Math.round(value * 10) / 10 - 0.01) * 100) / 100;
}

function fakeSha256(rand: () => number) {
  let hex = "";
  for (let i = 0; i < 64; i++) hex += Math.floor(rand() * 16).toString(16);
  return hex;
}

function demoLabelUrl(p: Pick<ChickenPrice, "id" | "brand" | "price_per_kg" | "market_name" | "state_type" | "recorded_at">) {
  const params = new URLSearchParams({
    brand: p.brand,
    price: p.price_per_kg.toFixed(2),
    market: p.market_name,
    type: p.state_type,
    date: p.recorded_at,
    seed: p.id.slice(-4),
  });
  return `/demo/label?${params.toString()}`;
}

function buildMockPrices(): ChickenPrice[] {
  const rand = mulberry32(20260912);
  const rows: ChickenPrice[] = [];
  let n = 0;

  for (let week = 0; week < WEEKS; week++) {
    const saturday = addDays(FIRST_WEEK, week * 7);
    MARKETS.forEach((market, mi) => {
      // Cada mercado registra 2 das 3 marcas por semana, em rodízio.
      const skip = (week + mi) % BRAND_ORDER.length;
      BRAND_ORDER.forEach((brand, bi) => {
        if (bi === skip) return;
        n++;
        const noise = 1 + (rand() - 0.5) * 0.03;
        const frozen = market.stateType === "congelado" ? 0.91 : 1;
        const price = shelfPrice(BRAND_BASE[brand] * market.regional * frozen * WEEKLY_TREND[week] * noise);
        const recordedAt = addDays(saturday, Math.floor(rand() * 3) - 1); // sex, sáb ou dom
        const hasExif = rand() > 0.15;
        const hour = 9 + Math.floor(rand() * 11);
        const minute = Math.floor(rand() * 60);
        const id = `demo-${String(n).padStart(4, "0")}`;
        const exifDatetime = hasExif
          ? `${recordedAt}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-03:00`
          : null;

        const row: ChickenPrice = {
          id,
          brand,
          state_type: market.stateType,
          price_per_kg: price,
          market_name: market.name,
          city: market.city,
          state: market.state,
          recorded_at: recordedAt,
          photo_url: "",
          original_sha256: fakeSha256(rand),
          exif_device: hasExif ? DEVICES[Math.floor(rand() * DEVICES.length)] : null,
          exif_datetime: exifDatetime,
          has_valid_exif: hasExif,
          created_at: `${recordedAt}T${String(Math.min(hour + 1, 23)).padStart(2, "0")}:10:00-03:00`,
        };
        row.photo_url = demoLabelUrl(row);
        rows.push(row);
      });
    });
  }

  return rows.sort((a, b) => b.recorded_at.localeCompare(a.recorded_at) || b.created_at.localeCompare(a.created_at));
}

export const MOCK_PRICES: ChickenPrice[] = buildMockPrices();

export const MOCK_SETTINGS: EconomicSettings = {
  min_wage: 1518.0,
  avg_wage: 3225.0,
  updated_at: "2026-09-01T00:00:00-03:00",
};
