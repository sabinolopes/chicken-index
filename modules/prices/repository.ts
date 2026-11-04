import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChickenPrice } from "./types";
import type { PriceDetails, PriceInput } from "./validation";

export const PRICE_COLUMNS =
  "id, brand, state_type, price_kind, price_per_kg, market_name, city, state, recorded_at, photo_url, original_sha256, exif_device, exif_datetime, has_valid_exif, created_at, updated_at";

/** O Postgres devolve `numeric` como texto; a interface trabalha com número. */
export const toChickenPrice = (row: Record<string, unknown>) =>
  ({ ...row, price_per_kg: Number(row.price_per_kg) }) as ChickenPrice;

/** Escritas e leituras pontuais de `chicken_prices` que as regras de cadastro precisam. */
export interface PricesRepository {
  /** Registro que já usa esta foto (mesmo hash do original), ou null. */
  findByHash(sha256: string): Promise<{ market_name: string; recorded_at: string } | null>;
  insert(record: PriceInput & { photo_url: string }): Promise<void>;
  /** URL da foto do registro, ou null se o registro não existe. */
  findPhotoUrl(id: string): Promise<string | null>;
  remove(id: string): Promise<void>;
  /** Corrige os dados da etiqueta; false se o registro não existe. */
  update(id: string, details: PriceDetails): Promise<boolean>;
}

/** Implementação sobre o Supabase. As permissões vêm do RLS da sessão do cliente recebido. */
export function createPricesRepository(supabase: SupabaseClient): PricesRepository {
  const table = () => supabase.from("chicken_prices");
  return {
    async findByHash(sha256) {
      const { data, error } = await table().select("market_name, recorded_at").eq("original_sha256", sha256).maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    async insert(record) {
      const { error } = await table().insert(record);
      if (error) throw new Error(error.message);
    },
    async findPhotoUrl(id) {
      const { data, error } = await table().select("photo_url").eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data?.photo_url ?? null;
    },
    async remove(id) {
      const { error } = await table().delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    async update(id, details) {
      // O select devolve as linhas alteradas: sem nenhuma, o id não existe (ou o RLS barrou).
      const { data, error } = await table().update(details).eq("id", id).select("id");
      if (error) throw new Error(error.message);
      return (data ?? []).length > 0;
    },
  };
}
