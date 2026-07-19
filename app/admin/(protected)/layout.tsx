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
  const [menuAbierto, setMenuAbierto] = useState(false);

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

  // Cierra el menú móvil solo cuando cambiás de página.
  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  if (!sesion) return null;

  const linksSuperadmin = [{ href: "/admin/tiendas", label: "Tiendas" }];
  const linksAdminTienda = [
    { href: "/admin/tienda/productos", label: "Productos" },
    { href: "/admin/tienda/inventario", label: "Inventario" },
    { href: "/admin/tienda/categorias", label: "Categorías" },
    { href: "/admin/tienda/ofertas", label: "Ofertas" },
    { href: "/admin/tienda/ventas", label: "Ventas" },
    { href: "/admin/tienda/historial-ventas", label: "Historial" },
    { href: "/admin/tienda/reportes", label: "Reportes" },
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

  const etiquetaRol =
    sesion.rol === "superadmin" ? "Superadmin" : sesion.rol === "admin_tienda" ? "Admin de tienda" : "Vendedor";

  async function salir() {
    await cerrarSesion();
    router.replace("/admin/login");
  }

  const logoTiendaEl =
    sesion.rol !== "superadmin" && nombreTienda ? (
      <div className="flex min-w-0 items-center gap-2">
        <span className="hidden text-line sm:inline">/</span>
        {logoTienda ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoTienda}
            alt={nombreTienda}
            className="h-6 w-6 shrink-0 rounded-full border border-line object-cover"
          />
        ) : (
          <span className="h-6 w-6 shrink-0 rounded-full bg-tealSoft" />
        )}
        <span className="truncate text-sm font-medium text-ink">{nombreTienda}</span>
      </div>
    ) : null;

  return (
    <header className="relative border-b border-line bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="shrink-0 font-display text-xl text-ink">Nugastore</span>
          {logoTiendaEl}
        </div>

        {/* Navegación de escritorio: se oculta en pantallas chicas */}
        <nav className="hidden items-center gap-4 md:flex">
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
          <span className="border-l border-line pl-4 text-xs text-inkSoft">{etiquetaRol}</span>
          <button onClick={salir} className="text-sm font-medium text-berry">
            Salir
          </button>
        </nav>

        {/* Botón hamburguesa: solo en pantallas chicas */}
        <button
          onClick={() => setMenuAbierto((v) => !v)}
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuAbierto}
          className="shrink-0 rounded-card p-2 text-ink md:hidden"
        >
          {menuAbierto ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Menú desplegable móvil */}
      {menuAbierto && (
        <nav className="border-t border-line bg-white px-4 py-2 md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`block py-2.5 text-[15px] font-medium ${
                pathname === l.href ? "text-teal" : "text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/admin/cuenta"
            className={`block py-2.5 text-[15px] font-medium ${
              pathname === "/admin/cuenta" ? "text-teal" : "text-ink"
            }`}
          >
            Mi cuenta
          </Link>
          <div className="mt-1 flex items-center justify-between border-t border-line py-3">
            <span className="text-xs text-inkSoft">{etiquetaRol}</span>
            <button onClick={salir} className="text-sm font-medium text-berry">
              Salir
            </button>
          </div>
        </nav>
      )}
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
