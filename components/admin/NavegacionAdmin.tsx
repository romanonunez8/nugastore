"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ─────────────────────────────────────────────────────────────
// Navegación del panel admin
// - Escritorio (md+): barra lateral fija a la izquierda, agrupada.
// - Celular: barra superior con título + barra inferior con los
//   accesos principales y un botón "Más" que abre el resto.
// Íconos: SVG en línea (sin librerías extra, 100% gratis).
// ─────────────────────────────────────────────────────────────

export type Rol = "superadmin" | "admin_tienda" | "vendedor";

type NombreIcono =
  | "ventas"
  | "historial"
  | "reportes"
  | "productos"
  | "inventario"
  | "categorias"
  | "ofertas"
  | "tienda"
  | "equipo"
  | "cuenta"
  | "salir"
  | "mas"
  | "cerrar";

type ItemNav = {
  href: string;
  label: string;
  // Etiqueta corta para la barra inferior del celular
  corto?: string;
  icono: NombreIcono;
  // true = solo se marca activo si la ruta coincide exacto
  exacto?: boolean;
};

type GrupoNav = { titulo: string; items: ItemNav[] };

// Configuración por rol: grupos para la barra lateral y
// rutas principales (máx. 4) para la barra inferior del celular.
const NAV: Record<Rol, { grupos: GrupoNav[]; principales: string[] }> = {
  superadmin: {
    grupos: [
      {
        titulo: "Plataforma",
        items: [{ href: "/admin/tiendas", label: "Tiendas", icono: "tienda" }],
      },
    ],
    principales: ["/admin/tiendas"],
  },
  admin_tienda: {
    grupos: [
      {
        titulo: "Ventas",
        items: [
          { href: "/admin/tienda/ventas", label: "Ventas", icono: "ventas" },
          { href: "/admin/tienda/historial-ventas", label: "Historial", icono: "historial" },
          { href: "/admin/tienda/reportes", label: "Reportes", icono: "reportes" },
        ],
      },
      {
        titulo: "Catálogo",
        items: [
          { href: "/admin/tienda/productos", label: "Productos", icono: "productos" },
          { href: "/admin/tienda/inventario", label: "Inventario", corto: "Stock", icono: "inventario" },
          { href: "/admin/tienda/categorias", label: "Categorías", icono: "categorias" },
          { href: "/admin/tienda/ofertas", label: "Ofertas", icono: "ofertas" },
        ],
      },
      {
        titulo: "Tienda",
        items: [
          { href: "/admin/tienda", label: "Mi tienda", icono: "tienda", exacto: true },
          { href: "/admin/tienda/equipo", label: "Equipo", icono: "equipo" },
        ],
      },
    ],
    principales: [
      "/admin/tienda/ventas",
      "/admin/tienda/productos",
      "/admin/tienda/inventario",
      "/admin/tienda/reportes",
    ],
  },
  vendedor: {
    grupos: [
      {
        titulo: "Tienda",
        items: [
          { href: "/admin/tienda/ventas", label: "Ventas", icono: "ventas" },
          { href: "/admin/tienda/productos", label: "Productos", icono: "productos" },
        ],
      },
    ],
    principales: ["/admin/tienda/ventas", "/admin/tienda/productos"],
  },
};

const ITEM_CUENTA: ItemNav = { href: "/admin/cuenta", label: "Mi cuenta", corto: "Cuenta", icono: "cuenta" };

function estaActivo(pathname: string, item: ItemNav) {
  if (item.exacto) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

// ─── Íconos ──────────────────────────────────────────────────
function Icono({ nombre, className = "h-5 w-5" }: { nombre: NombreIcono; className?: string }) {
  const trazos: Record<NombreIcono, React.ReactNode> = {
    ventas: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M6 9v.01M18 15v.01" />
      </>
    ),
    historial: (
      <>
        <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
        <path d="M3 4v4h4" />
        <path d="M12 8v4l3 2" />
      </>
    ),
    reportes: (
      <>
        <path d="M4 20h16" />
        <path d="M7 16v-5M12 16V6M17 16v-8" />
      </>
    ),
    productos: (
      <path d="M9 4 5 6 2.5 10.5 5.5 12 7 10.5V20h10v-9.5l1.5 1.5 3-1.5L19 6l-4-2a3 3 0 0 1-6 0Z" />
    ),
    inventario: (
      <>
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
      </>
    ),
    categorias: (
      <>
        <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
        <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
        <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
        <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
      </>
    ),
    ofertas: (
      <>
        <path d="M3 12V4.5A1.5 1.5 0 0 1 4.5 3H12l9 9-9 9-9-9Z" />
        <circle cx="7.5" cy="7.5" r="1.2" />
      </>
    ),
    tienda: (
      <>
        <path d="M3 9.5 4.5 4h15L21 9.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z" />
        <path d="M5 12v8h14v-8M10 20v-5h4v5" />
      </>
    ),
    equipo: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
        <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" />
      </>
    ),
    cuenta: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </>
    ),
    salir: (
      <>
        <path d="M14 8V5.5A1.5 1.5 0 0 0 12.5 4h-7A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20h7a1.5 1.5 0 0 0 1.5-1.5V16" />
        <path d="M9 12h11M17 9l3 3-3 3" />
      </>
    ),
    mas: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    cerrar: <path d="M18 6 6 18M6 6l12 12" />,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {trazos[nombre]}
    </svg>
  );
}

// ─── Logo / identidad de la tienda ───────────────────────────
function Identidad({
  nombreTienda,
  logoTienda,
  etiquetaRol,
  compacto = false,
}: {
  nombreTienda: string | null;
  logoTienda: string | null;
  etiquetaRol: string;
  compacto?: boolean;
}) {
  const titulo = nombreTienda ?? "Nugastore";
  const tam = compacto ? "h-8 w-8" : "h-10 w-10";
  return (
    <div className="flex min-w-0 items-center gap-3">
      {logoTienda ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoTienda}
          alt={titulo}
          className={`${tam} shrink-0 rounded-xl border border-line object-cover`}
        />
      ) : (
        <span
          className={`${tam} flex shrink-0 items-center justify-center rounded-xl bg-tealSoft text-sm font-semibold text-teal`}
        >
          {titulo.slice(0, 2).toUpperCase()}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{titulo}</p>
        {!compacto && <p className="truncate text-xs text-inkSoft">{etiquetaRol}</p>}
      </div>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────
export default function NavegacionAdmin({
  rol,
  nombreTienda,
  logoTienda,
  onSalir,
}: {
  rol: Rol;
  nombreTienda: string | null;
  logoTienda: string | null;
  onSalir: () => void;
}) {
  const pathname = usePathname();
  const [masAbierto, setMasAbierto] = useState(false);

  const config = NAV[rol] ?? NAV.vendedor;
  const todos = config.grupos.flatMap((g) => g.items);
  const principales = config.principales
    .map((href) => todos.find((i) => i.href === href))
    .filter((i): i is ItemNav => Boolean(i));
  const secundarios = todos.filter((i) => !config.principales.includes(i.href));

  const etiquetaRol =
    rol === "superadmin" ? "Superadmin" : rol === "admin_tienda" ? "Admin de tienda" : "Vendedor";

  const itemActual = [...todos, ITEM_CUENTA].find((i) => estaActivo(pathname, i));
  const tituloPagina = itemActual?.label ?? "Panel";
  const masActivo = [...secundarios, ITEM_CUENTA].some((i) => estaActivo(pathname, i));

  // Cierra el panel "Más" al cambiar de página
  useEffect(() => {
    setMasAbierto(false);
  }, [pathname]);

  // Cierra con Escape y bloquea el scroll del fondo mientras está abierto
  useEffect(() => {
    if (!masAbierto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMasAbierto(false);
    document.addEventListener("keydown", onKey);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflowPrevio;
    };
  }, [masAbierto]);

  return (
    <>
      {/* ═════ ESCRITORIO: barra lateral ═════ */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-white md:flex">
        <div className="px-5 pb-4 pt-5">
          <span className="font-display text-xl text-ink">Nugastore</span>
        </div>

        <div className="mx-3 mb-2 rounded-card border border-line bg-paper px-3 py-3">
          <Identidad nombreTienda={nombreTienda} logoTienda={logoTienda} etiquetaRol={etiquetaRol} />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Menú del panel">
          {config.grupos.map((grupo) => (
            <div key={grupo.titulo} className="mt-4">
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-inkSoft/70">
                {grupo.titulo}
              </p>
              <ul className="space-y-0.5">
                {grupo.items.map((item) => {
                  const activo = estaActivo(pathname, item);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={activo ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                          activo ? "bg-tealSoft text-teal" : "text-inkSoft hover:bg-paper hover:text-ink"
                        }`}
                      >
                        <Icono nombre={item.icono} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="space-y-0.5 border-t border-line px-3 py-3">
          <Link
            href={ITEM_CUENTA.href}
            aria-current={estaActivo(pathname, ITEM_CUENTA) ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              estaActivo(pathname, ITEM_CUENTA) ? "bg-tealSoft text-teal" : "text-inkSoft hover:bg-paper hover:text-ink"
            }`}
          >
            <Icono nombre="cuenta" />
            Mi cuenta
          </Link>
          <button
            onClick={onSalir}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-berry transition-colors hover:bg-berrySoft"
          >
            <Icono nombre="salir" />
            Salir
          </button>
        </div>
      </aside>

      {/* ═════ CELULAR: barra superior ═════ */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <h1 className="truncate text-base font-semibold text-ink">{tituloPagina}</h1>
        <Identidad nombreTienda={nombreTienda} logoTienda={logoTienda} etiquetaRol={etiquetaRol} compacto />
      </header>

      {/* ═════ CELULAR: barra inferior ═════ */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Menú principal"
      >
        <ul className="flex">
          {principales.map((item) => {
            const activo = estaActivo(pathname, item);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={activo ? "page" : undefined}
                  className={`flex flex-col items-center gap-0.5 pb-2 pt-2.5 text-[11px] font-medium ${
                    activo ? "text-teal" : "text-inkSoft"
                  }`}
                >
                  <span className={`rounded-full px-4 py-1 ${activo ? "bg-tealSoft" : ""}`}>
                    <Icono nombre={item.icono} className="h-[22px] w-[22px]" />
                  </span>
                  {item.corto ?? item.label}
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              onClick={() => setMasAbierto(true)}
              aria-expanded={masAbierto}
              className={`flex w-full flex-col items-center gap-0.5 pb-2 pt-2.5 text-[11px] font-medium ${
                masActivo ? "text-teal" : "text-inkSoft"
              }`}
            >
              <span className={`rounded-full px-4 py-1 ${masActivo ? "bg-tealSoft" : ""}`}>
                <Icono nombre="mas" className="h-[22px] w-[22px]" />
              </span>
              Más
            </button>
          </li>
        </ul>
      </nav>

      {/* ═════ CELULAR: panel "Más" ═════ */}
      {masAbierto && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Más opciones">
          <button
            aria-label="Cerrar"
            onClick={() => setMasAbierto(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[24px] bg-white px-4 pt-3"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
            <div className="mb-3 flex items-center justify-between">
              <Identidad nombreTienda={nombreTienda} logoTienda={logoTienda} etiquetaRol={etiquetaRol} />
              <button
                onClick={() => setMasAbierto(false)}
                aria-label="Cerrar"
                className="rounded-full p-2 text-inkSoft hover:bg-paper"
              >
                <Icono nombre="cerrar" />
              </button>
            </div>

            {secundarios.length > 0 && (
              <div className="grid grid-cols-3 gap-2 border-t border-line pt-3">
                {secundarios.map((item) => {
                  const activo = estaActivo(pathname, item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={activo ? "page" : undefined}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-xs font-medium ${
                        activo ? "border-teal bg-tealSoft text-teal" : "border-line text-ink"
                      }`}
                    >
                      <Icono nombre={item.icono} className="h-6 w-6" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="mt-3 space-y-1 border-t border-line pt-3">
              <Link
                href={ITEM_CUENTA.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium ${
                  estaActivo(pathname, ITEM_CUENTA) ? "bg-tealSoft text-teal" : "text-ink"
                }`}
              >
                <Icono nombre="cuenta" />
                Mi cuenta
              </Link>
              <button
                onClick={onSalir}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-berry"
              >
                <Icono nombre="salir" />
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
