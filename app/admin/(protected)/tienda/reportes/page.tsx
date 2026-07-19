"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { useAdminAuth } from "@/lib/admin-auth-context";

type VentaCruda = {
  id: string;
  fecha: string;
  cantidad: number;
  precio_unitario: number | null;
  cliente_id: string | null;
  variantes: {
    producto_id: string;
    productos: { nombre: string; categoria_id: string | null } | null;
  } | null;
};

type Cliente = {
  id: string;
  nombre: string | null;
  telefono: string | null;
  email: string | null;
  fecha_nacimiento: string | null;
};

function diasHastaProximoCumple(fechaNacimiento: string) {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  const cumpleEsteAno = new Date(hoy.getFullYear(), nacimiento.getMonth(), nacimiento.getDate());
  if (cumpleEsteAno < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) {
    cumpleEsteAno.setFullYear(hoy.getFullYear() + 1);
  }
  const msPorDia = 1000 * 60 * 60 * 24;
  return Math.round((cumpleEsteAno.getTime() - hoy.getTime()) / msPorDia);
}

export default function ReportesPage() {
  const { sesion } = useAdminAuth();
  const [ventas, setVentas] = useState<VentaCruda[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [copiado, setCopiado] = useState(false);

  const urlCalendario =
    sesion?.tiendaId && typeof window !== "undefined"
      ? `${window.location.origin}/api/calendario/${sesion.tiendaId}/cumpleanos.ics`
      : "";

  async function copiarUrlCalendario() {
    try {
      await navigator.clipboard.writeText(urlCalendario);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // si el navegador bloquea el portapapeles, no pasa nada grave
    }
  }

  const cargar = useCallback(async () => {
    if (!sesion?.tiendaId) return;
    setCargando(true);

    const desde = new Date();
    desde.setDate(desde.getDate() - 90);

    const [{ data: ventasData }, { data: clientesData }] = await Promise.all([
      supabase
        .from("ventas")
        .select(
          "id, fecha, cantidad, precio_unitario, cliente_id, variantes!inner(producto_id, productos!inner(tienda_id, nombre, categoria_id))"
        )
        .eq("variantes.productos.tienda_id", sesion.tiendaId)
        .gte("fecha", desde.toISOString())
        .order("fecha", { ascending: true }),
      supabase.from("clientes").select("*").eq("tienda_id", sesion.tiendaId),
    ]);

    setVentas((ventasData as unknown as VentaCruda[]) ?? []);
    setClientes(clientesData ?? []);
    setCargando(false);
  }, [sesion]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // --- KPIs generales ---
  const totalVentasBs = useMemo(
    () => ventas.reduce((t, v) => t + v.cantidad * (v.precio_unitario ?? 0), 0),
    [ventas]
  );
  const cantidadVentas = ventas.length;
  const ticketPromedio = cantidadVentas > 0 ? totalVentasBs / cantidadVentas : 0;
  const clientesUnicos = useMemo(
    () => new Set(ventas.filter((v) => v.cliente_id).map((v) => v.cliente_id)).size,
    [ventas]
  );

  // --- Ventas por día (últimos 30 días) ---
  const ventasPorDia = useMemo(() => {
    const mapa = new Map<string, number>();
    const hace30 = new Date();
    hace30.setDate(hace30.getDate() - 30);
    ventas
      .filter((v) => new Date(v.fecha) >= hace30)
      .forEach((v) => {
        const dia = new Date(v.fecha).toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit" });
        mapa.set(dia, (mapa.get(dia) ?? 0) + v.cantidad * (v.precio_unitario ?? 0));
      });
    return Array.from(mapa.entries()).map(([dia, monto]) => ({ dia, monto: Math.round(monto * 100) / 100 }));
  }, [ventas]);

  // --- Productos más vendidos ---
  const productosMasVendidos = useMemo(() => {
    const mapa = new Map<string, { nombre: string; unidades: number }>();
    ventas.forEach((v) => {
      const nombre = v.variantes?.productos?.nombre ?? "—";
      const actual = mapa.get(nombre) ?? { nombre, unidades: 0 };
      actual.unidades += v.cantidad;
      mapa.set(nombre, actual);
    });
    return Array.from(mapa.values())
      .sort((a, b) => b.unidades - a.unidades)
      .slice(0, 8);
  }, [ventas]);

  // --- Clientes: frecuencia, gasto y ticket promedio ---
  const resumenClientes = useMemo(() => {
    const mapa = new Map<
      string,
      { cliente: Cliente; compras: number; total: number; ultima: string }
    >();
    ventas.forEach((v) => {
      if (!v.cliente_id) return;
      const cliente = clientes.find((c) => c.id === v.cliente_id);
      if (!cliente) return;
      const actual = mapa.get(v.cliente_id) ?? { cliente, compras: 0, total: 0, ultima: v.fecha };
      actual.compras += 1;
      actual.total += v.cantidad * (v.precio_unitario ?? 0);
      if (v.fecha > actual.ultima) actual.ultima = v.fecha;
      mapa.set(v.cliente_id, actual);
    });
    return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
  }, [ventas, clientes]);

  // --- Cumpleaños próximos (30 días) ---
  const cumpleanosProximos = useMemo(() => {
    return clientes
      .filter((c) => c.fecha_nacimiento)
      .map((c) => ({ cliente: c, dias: diasHastaProximoCumple(c.fecha_nacimiento!) }))
      .filter((c) => c.dias <= 30)
      .sort((a, b) => a.dias - b.dias);
  }, [clientes]);

  if (sesion && sesion.rol === "editor") {
    return <p className="text-berry">Esta sección es solo para el administrador de la tienda.</p>;
  }

  if (cargando) return <p className="text-inkSoft">Cargando…</p>;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl text-ink">Reportes</h1>
      <p className="-mt-6 text-xs text-inkSoft">Datos de los últimos 90 días</p>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-card border border-line bg-white p-4">
          <p className="text-xs text-inkSoft">Ventas totales</p>
          <p className="font-display text-xl text-ink">Bs {totalVentasBs.toFixed(2)}</p>
        </div>
        <div className="rounded-card border border-line bg-white p-4">
          <p className="text-xs text-inkSoft">Cantidad de ventas</p>
          <p className="font-display text-xl text-ink">{cantidadVentas}</p>
        </div>
        <div className="rounded-card border border-line bg-white p-4">
          <p className="text-xs text-inkSoft">Ticket promedio</p>
          <p className="font-display text-xl text-ink">Bs {ticketPromedio.toFixed(2)}</p>
        </div>
        <div className="rounded-card border border-line bg-white p-4">
          <p className="text-xs text-inkSoft">Clientes con compras</p>
          <p className="font-display text-xl text-ink">{clientesUnicos}</p>
        </div>
      </div>

      {/* Ventas por día */}
      <div className="rounded-card border border-line bg-white p-4">
        <h2 className="mb-3 font-medium text-ink">Ventas por día (últimos 30 días)</h2>
        {ventasPorDia.length === 0 ? (
          <p className="text-sm text-inkSoft">Todavía no hay ventas en este período.</p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ventasPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="dia" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v) => [`Bs ${v}`, "Ventas"]} />
                <Bar dataKey="monto" fill="#1a5c5c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Productos más vendidos */}
      <div className="rounded-card border border-line bg-white p-4">
        <h2 className="mb-3 font-medium text-ink">Productos más vendidos</h2>
        {productosMasVendidos.length === 0 ? (
          <p className="text-sm text-inkSoft">Todavía no hay datos.</p>
        ) : (
          <div className="space-y-1.5">
            {productosMasVendidos.map((p) => (
              <div key={p.nombre} className="flex items-center justify-between text-sm">
                <span className="text-ink">{p.nombre}</span>
                <span className="text-inkSoft">{p.unidades} unidades</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cumpleaños próximos */}
      <div className="rounded-card border border-line bg-white p-4">
        <h2 className="mb-1 font-medium text-ink">Cumpleaños próximos (30 días)</h2>
        <p className="mb-3 text-xs text-inkSoft">
          Ideal para mandar un saludo o descuento personalizado por WhatsApp.
        </p>
        {cumpleanosProximos.length === 0 ? (
          <p className="text-sm text-inkSoft">No hay cumpleaños próximos entre tus clientes.</p>
        ) : (
          <div className="space-y-1.5">
            {cumpleanosProximos.map(({ cliente, dias }) => (
              <div key={cliente.id} className="flex items-center justify-between text-sm">
                <span className="text-ink">
                  {cliente.nombre ?? cliente.telefono ?? "Cliente"}
                  {cliente.telefono && <span className="text-inkSoft"> · {cliente.telefono}</span>}
                </span>
                <span className="text-inkSoft">{dias === 0 ? "¡Hoy!" : `En ${dias} días`}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 border-t border-line pt-4">
          <p className="mb-1 text-sm font-medium text-ink">📅 Sincronizar con Google Calendar</p>
          <p className="mb-2 text-xs text-inkSoft">
            Pegá este enlace una sola vez en Google Calendar → engranaje ⚙️ → "Agregar
            calendario" → "Desde URL". Se va a ir actualizando solo cuando cargues clientes
            nuevos con fecha de nacimiento — no hace falta volver a pegarlo.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              readOnly
              value={urlCalendario}
              onFocus={(e) => e.target.select()}
              className="min-w-0 flex-1 rounded-card border border-line bg-paper px-3 py-2 text-xs text-inkSoft"
            />
            <button
              onClick={copiarUrlCalendario}
              className="shrink-0 rounded-card bg-teal px-4 py-2 text-xs font-medium text-white"
            >
              {copiado ? "¡Copiado!" : "Copiar enlace"}
            </button>
          </div>
        </div>
      </div>

      {/* Clientes: frecuencia y gasto */}
      <div className="rounded-card border border-line bg-white p-4">
        <h2 className="mb-3 font-medium text-ink">Clientes</h2>
        {resumenClientes.length === 0 ? (
          <p className="text-sm text-inkSoft">Todavía no hay ventas asociadas a clientes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-inkSoft">
                  <th className="py-2 pr-3 font-medium">Cliente</th>
                  <th className="py-2 pr-3 font-medium text-right">Compras</th>
                  <th className="py-2 pr-3 font-medium text-right">Total gastado</th>
                  <th className="py-2 pr-3 font-medium text-right">Ticket promedio</th>
                  <th className="py-2 pr-3 font-medium">Última compra</th>
                </tr>
              </thead>
              <tbody>
                {resumenClientes.map((r) => (
                  <tr key={r.cliente.id} className="border-b border-line last:border-0">
                    <td className="py-2 pr-3 text-ink">
                      {r.cliente.nombre ?? r.cliente.telefono ?? "Cliente"}
                    </td>
                    <td className="py-2 pr-3 text-right text-ink">{r.compras}</td>
                    <td className="py-2 pr-3 text-right text-ink">Bs {r.total.toFixed(2)}</td>
                    <td className="py-2 pr-3 text-right text-ink">
                      Bs {(r.total / r.compras).toFixed(2)}
                    </td>
                    <td className="py-2 pr-3 text-inkSoft">
                      {new Date(r.ultima).toLocaleDateString("es-BO")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
