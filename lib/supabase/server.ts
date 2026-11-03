import { cookies } from "next/headers";
import { connection } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

/**
 * Cliente com a sessão do admin (cookies). Lê dados da requisição, então só pode
 * ser usado em Server Actions ou em componentes dentro de `<Suspense>`.
 */
export async function createServerSupabase() {
  // O cliente lê o relógio (expiração do token): marca a renderização como
  // de requisição antes disso, exigência do Cache Components.
  await connection();
  const { url, anonKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Chamado de um Server Component: o proxy.ts já renova a sessão.
        }
      },
    },
  });
}
