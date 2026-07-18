"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase, type Producto } from "@/lib/supabase";
import { useAdminAuth } from "@/lib/admin-auth-context";

export default function ProductosPage() {
  const { sesion } = useAdminAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const esVendedor = sesion?.rol === "editor";

  const cargar = useCallback(async () => {
    if (!sesion?.tiendaId) return;
    setCargando(true);
    const { data } = await supabase
      .from("productos")
      .select("*, categorias(nombre), variantes(stock)")
      .eq("tienda_id", sesion.tiendaId)
      .order("nombre");
    setProductos((data as unknown as Producto[]) ?? []);
    setCargando(false);
  }, [sesion]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function toggleActivo(p: Producto) {
    await supabase.from("productos").update({ activo: !p.activo }).eq("id", p.id);
    cargar();
  }

  if (sesion && sesion.rol === "superadmin") {
    return <p className="text-berry">Esta sección es para administradores de tienda.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Productos</h1>
        {!esVendedor && (
          <Link
            href="/admin/tienda/productos/nuevo"
            className="rounded-card bg-teal text-white font-medium px-5 py-3 shadow-card"
          >
            + Nuevo producto
          </Link>
        )}
      </div>

      {cargando ? (
        <p className="text-inkSoft">Cargando…</p>
      ) : productos.length === 0 ? (
        <p className="text-inkSoft">Todavía no cargaste productos.</p>
      ) : (
        <div className="space-y-2">
          {productos.map((p) => {
            const stockTotal = (p.variantes ?? []).reduce((t, v) => t + v.stock, 0);
            return (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-card border border-line bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium text-ink">
                    {p.nombre}{" "}
                    <span className="text-xs text-inkSoft font-normal">({p.codigo})</span>
                  </p>
                  <p className="text-xs text-inkSoft">
                    {p.categorias?.nombre ?? "Sin categoría"} · Bs {p.precio} · Stock {stockTotal}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {esVendedor ? (
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        p.activo ? "bg-tealSoft text-teal" : "bg-berrySoft text-berry"
                      }`}
                    >
                      {p.activo ? "Activo" : "Desactivado"}
                    </span>
                  ) : (
                    <button
                      onClick={() => toggleActivo(p)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        p.activo ? "bg-tealSoft text-teal" : "bg-berrySoft text-berry"
                      }`}
                    >
                      {p.activo ? "Activo" : "Desactivado"}
                    </button>
                  )}
                  {!esVendedor && (
                    <Link
                      href={`/admin/tienda/productos/${p.id}`}
                      className="text-sm font-medium text-teal"
                    >
                      Editar
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
