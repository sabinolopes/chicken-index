import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Drumstick, ExternalLink, LogOut, Users } from "lucide-react";
import { getAdmin } from "@/lib/auth";
import { signOut } from "@/app/admin/actions";

export const metadata: Metadata = { title: "Admin · Frangômetro", robots: { index: false } };

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <Drumstick className="size-5 text-accent" aria-hidden />
            <span>Admin</span>
          </Link>
          <nav className="ml-auto flex items-center gap-1 text-sm">
            <Link href="/admin/usuarios" className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-muted hover:bg-stone-100 hover:text-foreground">
              <Users className="size-4" aria-hidden />
              <span className="hidden sm:inline">Admins</span>
            </Link>
            <Link href="/" className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-muted hover:bg-stone-100 hover:text-foreground">
              Site <ExternalLink className="size-3.5" aria-hidden />
            </Link>
            <Suspense fallback={null}>
              <UserMenu />
            </Suspense>
          </nav>
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-5">{children}</div>
    </div>
  );
}

async function UserMenu() {
  const admin = await getAdmin();
  if (!admin) return null;
  return (
    <form action={signOut} className="flex items-center gap-2">
      <span className="hidden max-w-40 truncate text-subtle sm:inline">{admin.email}</span>
      <button
        type="submit"
        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-muted hover:bg-stone-100 hover:text-foreground"
      >
        <LogOut className="size-4" aria-hidden />
        Sair
      </button>
    </form>
  );
}
