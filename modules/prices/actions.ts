"use server";

import { failure, type ActionResult } from "@/lib/action-result";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/modules/auth/session";
import { refreshDashboard } from "@/modules/dashboard/cache";
import { r2PhotoStorage } from "@/modules/photos/storage";
import { createPricesRepository } from "./repository";
import { editPrice, registerPrice, removePrice, type RegisterPriceResult } from "./service";
import { isPriceId, parsePhotoFile, parsePriceDetails, parsePriceForm } from "./validation";

// Camada fina: confere o admin, valida a entrada, chama o serviço e atualiza o cache.

export async function createPrice(form: FormData): Promise<RegisterPriceResult> {
  await requireAdmin();

  const parsed = parsePriceForm(form);
  if ("error" in parsed) return failure(parsed.error);
  const photo = parsePhotoFile(form.get("photo"));
  if ("error" in photo) return failure(photo.error);

  const prices = createPricesRepository(await createServerSupabase());
  const result = await registerPrice({ input: parsed.data, photo: photo.file, prices, photos: r2PhotoStorage });
  if (result.ok) refreshDashboard();
  return result;
}

export async function deletePrice(id: string): Promise<ActionResult> {
  await requireAdmin();

  const prices = createPricesRepository(await createServerSupabase());
  const result = await removePrice({ id, prices, photos: r2PhotoStorage });
  // Mesmo com aviso sobre a foto, o registro pode já ter saído do banco.
  refreshDashboard();
  return result;
}

export async function updatePrice(id: string, form: FormData): Promise<ActionResult> {
  await requireAdmin();

  if (!isPriceId(id)) return failure("Registro não encontrado.");
  const parsed = parsePriceDetails(form);
  if ("error" in parsed) return failure(parsed.error);

  const prices = createPricesRepository(await createServerSupabase());
  const result = await editPrice({ id, details: parsed.data, prices });
  if (result.ok) refreshDashboard();
  return result;
}
