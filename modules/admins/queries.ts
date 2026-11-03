import "server-only";
import { createAdminDirectory } from "./directory";
import { toAdminList, type AdminListItem } from "./service";

/** Admins para a página Admins. Chamar só depois de `requireAdmin()`. */
export async function listAdmins(): Promise<AdminListItem[]> {
  return toAdminList(await createAdminDirectory().listUsers());
}
