"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAdminAuth } from "@/lib/admin-auth-context";

type FilaVenta = {
  id: string;
  fecha: string;
  cantidad: number;
  precio_unitario: number | null;
  canal: string;
  vendido_por_email: string | null;
  variantes: {
    talla: string | null;
    color: string | null;
    productos: { nombre: string; codigo: string; precio: number } | null;
  } | null;
  clientes: { nombre: string | null; telefono: string | null } | null;
};

export default function HistorialVentasPage() {
  const { sesion } = useAdminAuth();
  const [ventas, setVentas] = useState<FilaVenta[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    if (!sesion?.tiendaId) return;
    setCargando(true);
    const { data } = await supabase
      .from("ventas")
      .select(
        "id, fecha, cantidad, precio_unitario, canal, vendido_por_email, variantes!inner(talla, color, productos!inner(tienda_id, nombre, codigo, precio)), clientes(nombre, telefono)"
      )
      .eq("variantes.productos.tienda_id", sesion.tiendaId)
      .order("fecha", { ascending: false })
      .limit(200);
    setVentas((data as unknown as FilaVenta[]) ?? []);
    setCargando(false);
  }, [sesion]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (sesion && sesion.rol === "editor") {
    return <p className="text-berry">Esta sección es solo para el administrador de la tienda.</p>;
  }

  const totalGeneral = ventas.reduce((t, v) => t + v.cantidad * (v.precio_unitario ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">Historial de ventas</h1>
        <p className="text-sm text-inkSoft">
          Total mostrado: <span className="font-semibold text-ink">Bs {totalGeneral.toFixed(2)}</span>
        </p>
      </div>

      {cargando ? (
        <p className="text-inkSoft">Cargando…</p>
      ) : ventas.length === 0 ? (
        <p className="text-inkSoft">Todavía no hay ventas registradas.</p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-line bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-inkSoft">
                <th className="px-3 py-2 font-medium">Fecha</th>
                <th className="px-3 py-2 font-medium">Producto</th>
                <th className="px-3 py-2 font-medium">Talla / Color</th>
                <th className="px-3 py-2 font-medium text-right">Cant.</th>
                <th className="px-3 py-2 font-medium text-right">Precio unit.</th>
                <th className="px-3 py-2 font-medium text-right">Total</th>
                <th className="px-3 py-2 font-medium">Cliente</th>
                <th className="px-3 py-2 font-medium">Canal</th>
                <th className="px-3 py-2 font-medium">Vendido por</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((v) => {
                const conOferta =
                  v.variantes?.productos?.precio != null &&
                  v.precio_unitario != null &&
                  v.precio_unitario < v.variantes.productos.precio;
                return (
                  <tr key={v.id} className="border-b border-line last:border-0">
                    <td className="px-3 py-2 text-inkSoft whitespace-nowrap">
                      {new Date(v.fecha).toLocaleString("es-BO", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-3 py-2 text-ink">
                      {v.variantes?.productos?.nombre ?? "—"}{" "}
                      <span className="text-inkSoft text-xs">
                        ({v.variantes?.productos?.codigo ?? "—"})
                      </span>
                    </td>
                    <td className="px-3 py-2 text-inkSoft">
                      {v.variantes?.talla ?? "—"} {v.variantes?.color ? `· ${v.variantes.color}` : ""}
                    </td>
                    <td className="px-3 py-2 text-right text-ink">{v.cantidad}</td>
                    <td className="px-3 py-2 text-right text-ink">
                      Bs {(v.precio_unitario ?? 0).toFixed(2)}
                      {conOferta && (
                        <span className="ml-1.5 rounded-full bg-berrySoft px-1.5 py-0.5 text-[10px] font-medium text-berry">
                          Oferta
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-ink">
                      Bs {(v.cantidad * (v.precio_unitario ?? 0)).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-inkSoft">
                      {v.clientes?.nombre ?? v.clientes?.telefono ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-inkSoft capitalize">{v.canal}</td>
                    <td className="px-3 py-2 text-inkSoft">{v.vendido_por_email ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {ventas.length === 200 && (
        <p className="text-xs text-inkSoft">
          Mostrando las últimas 200 ventas. Más adelante sumamos filtros por fecha para ver el
          historial completo.
        </p>
      )}
    </div>
  );
}
