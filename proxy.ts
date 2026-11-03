import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAdminUser } from "@/lib/admin-role";
import { getSupabaseConfig } from "@/lib/supabase/config";

/**
 * Renova a sessão do Supabase e faz a checagem otimista de login em /admin.
 * A autorização de verdade é refeita em cada página e Server Action (lib/auth.ts).
 */
export async function proxy(request: NextRequest) {
  const { url, anonKey } = getSupabaseConfig();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list, headers) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = isAdminUser(user);
  const isLogin = request.nextUrl.pathname.startsWith("/admin/login");
  if (!admin && !isLogin) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  if (admin && isLogin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
