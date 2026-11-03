import { describe, expect, it } from "vitest";
import type { PhotoStorage } from "@/modules/photos/storage";
import type { PricesRepository } from "@/modules/prices/repository";
import { registerPrice, removePrice } from "@/modules/prices/service";
import type { PriceInput } from "@/modules/prices/validation";

const HASH = "ab".repeat(32);
const PUBLIC_URL = "https://pub-teste.r2.dev";

const input: PriceInput = {
  brand: "Sadia",
  state_type: "resfriado",
  price_kind: "regular",
  price_per_kg: 21.99,
  market_name: "Unidos",
  city: "Itaperuna",
  state: "RJ",
  recorded_at: "2026-11-02",
  original_sha256: HASH,
  exif_device: "Apple iPhone 13",
  exif_datetime: "2026-11-02T14:00:00.000Z",
  has_valid_exif: true,
};

const webp = () => new File([new Uint8Array(2048)], "etiqueta.webp", { type: "image/webp" });

/** Banco em memória com a mesma interface do repositório real. */
function memoryPrices(options: { failOn?: keyof PricesRepository } = {}) {
  const rows = new Map<string, PriceInput & { photo_url: string }>();
  const failIf = (method: keyof PricesRepository) => {
    if (options.failOn === method) throw new Error(`banco fora do ar (${method})`);
  };
  const repository: PricesRepository = {
    async findByHash(sha256) {
      failIf("findByHash");
      const row = [...rows.values()].find((candidate) => candidate.original_sha256 === sha256);
      return row ? { market_name: row.market_name, recorded_at: row.recorded_at } : null;
    },
    async insert(record) {
      failIf("insert");
      rows.set(`id-${rows.size + 1}`, record);
    },
    async findPhotoUrl(id) {
      failIf("findPhotoUrl");
      return rows.get(id)?.photo_url ?? null;
    },
    async remove(id) {
      failIf("remove");
      rows.delete(id);
    },
  };
  return { repository, rows };
}

/** Armazenamento de fotos em memória com a mesma interface do R2. */
function memoryPhotos(options: { failOn?: keyof PhotoStorage } = {}) {
  const files = new Map<string, File>();
  const storage: PhotoStorage = {
    async upload(key, photo) {
      if (options.failOn === "upload") throw new Error("R2 respondeu 503");
      files.set(key, photo);
      return `${PUBLIC_URL}/${key}`;
    },
    async remove(key) {
      if (options.failOn === "remove") throw new Error("R2 respondeu 503");
      files.delete(key);
    },
  };
  return { storage, files };
}

describe("registerPrice", () => {
  it("grava a foto pelo hash e o registro com a URL pública", async () => {
    const prices = memoryPrices();
    const photos = memoryPhotos();

    const result = await registerPrice({ input, photo: webp(), prices: prices.repository, photos: photos.storage });

    expect(result).toEqual({ ok: true, message: "Preço cadastrado e publicado no dashboard.", record: input });
    expect([...photos.files.keys()]).toEqual([`2026-11/${HASH}.webp`]);
    expect([...prices.rows.values()]).toEqual([{ ...input, photo_url: `${PUBLIC_URL}/2026-11/${HASH}.webp` }]);
  });

  it("recusa a mesma foto duas vezes, sem enviar nada", async () => {
    const prices = memoryPrices();
    const photos = memoryPhotos();
    await registerPrice({ input, photo: webp(), prices: prices.repository, photos: photos.storage });
    photos.files.clear();

    const result = await registerPrice({ input: { ...input, price_per_kg: 19.9 }, photo: webp(), prices: prices.repository, photos: photos.storage });

    expect(result).toEqual({ ok: false, error: "Esta foto já foi cadastrada (Unidos, 02/11/2026)." });
    expect(photos.files.size).toBe(0);
    expect(prices.rows.size).toBe(1);
  });

  it("sem conseguir checar duplicidade, bloqueia em vez de arriscar (fail-secure)", async () => {
    const prices = memoryPrices({ failOn: "findByHash" });
    const photos = memoryPhotos();

    const result = await registerPrice({ input, photo: webp(), prices: prices.repository, photos: photos.storage });

    expect(result).toEqual({ ok: false, error: "Erro ao consultar o banco: banco fora do ar (findByHash)" });
    expect(photos.files.size).toBe(0);
  });

  it("se o upload falha, não cria registro sem foto", async () => {
    const prices = memoryPrices();
    const photos = memoryPhotos({ failOn: "upload" });

    const result = await registerPrice({ input, photo: webp(), prices: prices.repository, photos: photos.storage });

    expect(result).toEqual({ ok: false, error: "Falha no upload da foto: R2 respondeu 503" });
    expect(prices.rows.size).toBe(0);
  });

  it("se o registro falha, apaga a foto enviada para não deixar arquivo órfão", async () => {
    const prices = memoryPrices({ failOn: "insert" });
    const photos = memoryPhotos();

    const result = await registerPrice({ input, photo: webp(), prices: prices.repository, photos: photos.storage });

    expect(result).toEqual({ ok: false, error: "Falha ao salvar o registro: banco fora do ar (insert)" });
    expect(photos.files.size).toBe(0);
  });
});

describe("removePrice", () => {
  async function seeded() {
    const prices = memoryPrices();
    const photos = memoryPhotos();
    await registerPrice({ input, photo: webp(), prices: prices.repository, photos: photos.storage });
    return { prices, photos };
  }

  it("apaga o registro e a foto", async () => {
    const { prices, photos } = await seeded();

    const result = await removePrice({ id: "id-1", prices: prices.repository, photos: photos.storage });

    expect(result).toEqual({ ok: true, message: "Registro excluído." });
    expect(prices.rows.size).toBe(0);
    expect(photos.files.size).toBe(0);
  });

  it("avisa quando o registro não existe", async () => {
    const { prices, photos } = await seeded();

    const result = await removePrice({ id: "id-inexistente", prices: prices.repository, photos: photos.storage });

    expect(result).toEqual({ ok: false, error: "Registro não encontrado." });
    expect(prices.rows.size).toBe(1);
  });

  it("tira o registro do ar mesmo se a foto não puder ser apagada, e avisa", async () => {
    const { prices } = await seeded();
    const failingPhotos = memoryPhotos({ failOn: "remove" });

    const result = await removePrice({ id: "id-1", prices: prices.repository, photos: failingPhotos.storage });

    expect(result).toEqual({ ok: false, error: "Registro excluído, mas a foto ficou no armazenamento (R2 respondeu 503)." });
    expect(prices.rows.size).toBe(0);
  });

  it("não mexe em fotos de URL fora do padrão (ex.: do armazenamento antigo)", async () => {
    const prices = memoryPrices();
    const photos = memoryPhotos();
    photos.files.set("2026-11/outra.webp", webp());
    await prices.repository.insert({ ...input, photo_url: "https://x.supabase.co/storage/v1/object/public/price-photos/foto.webp" });

    const result = await removePrice({ id: "id-1", prices: prices.repository, photos: photos.storage });

    expect(result).toEqual({ ok: true, message: "Registro excluído." });
    expect(photos.files.size).toBe(1);
  });

  it("se o banco recusa a exclusão, mantém a foto", async () => {
    const { photos } = await seeded();
    const failing = memoryPrices({ failOn: "remove" });
    await failing.repository.insert({ ...input, photo_url: `${PUBLIC_URL}/2026-11/${HASH}.webp` });

    const result = await removePrice({ id: "id-1", prices: failing.repository, photos: photos.storage });

    expect(result).toEqual({ ok: false, error: "Falha ao excluir: banco fora do ar (remove)" });
    expect(photos.files.size).toBe(1);
  });
});
