"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth-context";
import { cerrarSesion } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

function BarraAdmin() {
  const { sesion } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [nombreTienda, setNombreTienda] = useState<string | null>(null);
  const [logoTienda, setLogoTienda] = useState<string | null>(null);

  useEffect(() => {
    if (!sesion?.tiendaId) {
      setNombreTienda(null);
      setLogoTienda(null);
      return;
    }
    supabase
      .from("tiendas")
      .select("nombre, logo_url")
      .eq("id", sesion.tiendaId)
      .single()
      .then(({ data }) => {
        setNombreTienda(data?.nombre ?? null);
        setLogoTienda(data?.logo_url ?? null);
      });
  }, [sesion?.tiendaId]);

  if (!sesion) return null;

  const linksSuperadmin = [{ href: "/admin/tiendas", label: "Tiendas" }];
  const linksAdminTienda = [
    { href: "/admin/tienda/productos", label: "Productos" },
    { href: "/admin/tienda/categorias", label: "Categorías" },
    { href: "/admin/tienda/ofertas", label: "Ofertas" },
    { href: "/admin/tienda/ventas", label: "Ventas" },
    { href: "/admin/tienda/equipo", label: "Equipo" },
    { href: "/admin/tienda", label: "Mi tienda" },
  ];
  const linksVendedor = [
    { href: "/admin/tienda/ventas", label: "Ventas" },
    { href: "/admin/tienda/productos", label: "Productos" },
  ];
  const links =
    sesion.rol === "superadmin"
      ? linksSuperadmin
      : sesion.rol === "admin_tienda"
      ? linksAdminTienda
      : linksVendedor;

  async function salir() {
    await cerrarSesion();
    router.replace("/admin/login");
  }

  return (
    <header className="border-b border-line bg-white">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="font-display text-xl text-ink">Nugastore</span>
          {sesion.rol !== "superadmin" && nombreTienda && (
            <>
              <span className="text-line">/</span>
              {logoTienda ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoTienda}
                  alt={nombreTienda}
                  className="w-6 h-6 rounded-full object-cover border border-line"
                />
              ) : (
                <span className="w-6 h-6 rounded-full bg-tealSoft" />
              )}
              <span className="font-medium text-ink text-sm">{nombreTienda}</span>
            </>
          )}
        </div>
        <nav className="flex items-center gap-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium ${
                pathname === l.href ? "text-teal" : "text-inkSoft"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/admin/cuenta"
            className={`text-sm font-medium ${
              pathname === "/admin/cuenta" ? "text-teal" : "text-inkSoft"
            }`}
          >
            Mi cuenta
          </Link>
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
