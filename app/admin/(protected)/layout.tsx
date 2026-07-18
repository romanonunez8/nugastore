"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth-context";
import { cerrarSesion } from "@/lib/auth";

function BarraAdmin() {
  const { sesion } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!sesion) return null;

  const linksSuperadmin = [{ href: "/admin/tiendas", label: "Tiendas" }];
  const linksTienda = [{ href: "/admin/tienda", label: "Mi tienda" }];
  const links = sesion.rol === "superadmin" ? linksSuperadmin : linksTienda;

  async function salir() {
    await cerrarSesion();
    router.replace("/admin/login");
  }

  return (
    <header className="border-b border-line bg-white">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <span className="font-display text-xl text-ink">Nugastore</span>
        <nav className="flex items-center gap-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium ${
                pathname?.startsWith(l.href) ? "text-teal" : "text-inkSoft"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <span className="text-xs text-inkSoft border-l border-line pl-4">
            {sesion.rol === "superadmin" ? "Superadmin" : sesion.rol === "admin_tienda" ? "Admin de tienda" : "Editor"}
          </span>
          <button onClick={salir} className="text-sm text-berry font-medium">
            Salir
          </button>
        </nav>
      </div>
    </header>
  );
}

function Contenido({ children }: { children: React.ReactNode }) {
  const { cargando, sesion } = useAdminAuth();

  if (cargando) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center text-inkSoft">
        Cargando…
      </div>
    );
  }

  if (!sesion) {
    // El provider ya redirige a /admin/login; esto evita un parpadeo de contenido protegido.
    return null;
  }

  return (
    <div className="min-h-screen bg-paper">
      <BarraAdmin />
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <Contenido>{children}</Contenido>
    </AdminAuthProvider>
  );
}
