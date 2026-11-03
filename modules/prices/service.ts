import { errorMessage, failure, success, type ActionFailure, type ActionResult } from "@/lib/action-result";
import { formatDate } from "@/lib/format";
import { photoKeyFor, photoKeyFromUrl } from "@/modules/photos/keys";
import type { PhotoStorage } from "@/modules/photos/storage";
import type { PricesRepository } from "./repository";
import type { PriceInput } from "./validation";

export type RegisterPriceResult = { ok: true; message: string; record: PriceInput } | ActionFailure;

interface RegisterPriceOptions {
  input: PriceInput;
  photo: File;
  prices: PricesRepository;
  photos: PhotoStorage;
}

/**
 * Cadastra um preço já validado: recusa foto repetida (mesmo hash do original),
 * grava a foto e depois o registro. Se o registro falhar, apaga a foto enviada
 * para não deixar arquivo órfão no armazenamento.
 */
export async function registerPrice({ input, photo, prices, photos }: RegisterPriceOptions): Promise<RegisterPriceResult> {
  let existing: Awaited<ReturnType<PricesRepository["findByHash"]>>;
  try {
    existing = await prices.findByHash(input.original_sha256);
  } catch (error) {
    return failure(`Erro ao consultar o banco: ${errorMessage(error)}`);
  }
  if (existing) return failure(`Esta foto já foi cadastrada (${existing.market_name}, ${formatDate(existing.recorded_at)}).`);

  const key = photoKeyFor({ recordedAt: input.recorded_at, sha256: input.original_sha256, mimeType: photo.type });
  let photoUrl: string;
  try {
    photoUrl = await photos.upload(key, photo);
  } catch (error) {
    return failure(`Falha no upload da foto: ${errorMessage(error)}`);
  }

  try {
    await prices.insert({ ...input, photo_url: photoUrl });
  } catch (error) {
    await photos.remove(key).catch(() => undefined);
    return failure(`Falha ao salvar o registro: ${errorMessage(error)}`);
  }

  return { ok: true, message: "Preço cadastrado e publicado no dashboard.", record: input };
}

interface RemovePriceOptions {
  id: string;
  prices: PricesRepository;
  photos: PhotoStorage;
}

/**
 * Exclui o registro e depois a foto. O registro sai do ar primeiro: se a foto não
 * puder ser apagada, avisa o admin em vez de desfazer a exclusão.
 */
export async function removePrice({ id, prices, photos }: RemovePriceOptions): Promise<ActionResult> {
  const photoUrl = await prices.findPhotoUrl(id).catch(() => null);
  if (!photoUrl) return failure("Registro não encontrado.");

  try {
    await prices.remove(id);
  } catch (error) {
    return failure(`Falha ao excluir: ${errorMessage(error)}`);
  }

  const key = photoKeyFromUrl(photoUrl);
  if (!key) return success("Registro excluído.");
  try {
    await photos.remove(key);
  } catch (error) {
    return failure(`Registro excluído, mas a foto ficou no armazenamento (${errorMessage(error)}).`);
  }
  return success("Registro excluído.");
}
