"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, type Producto, type Variante, type Cliente, type Venta } from "@/lib/supabase";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { mensajeErrorAmigable } from "@/lib/errors";
import { CampoNumero } from "@/components/admin/CampoNumero";

export default function VentasPage() {
  const { sesion } = useAdminAuth();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [productoId, setProductoId] = useState("");
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [varianteId, setVarianteId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [canal, setCanal] = useState("whatsapp");

  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [clientesEncontrados, setClientesEncontrados] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [clienteNombre, setClienteNombre] = useState("");
  const [nuevoCliente, setNuevoCliente] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nuevoNacimiento, setNuevoNacimiento] = useState("");

  const [ventasRecientes, setVentasRecientes] = useState<
    (Venta & { productos?: { nombre: string; precio: number } })[]
  >([]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargarProductos = useCallback(async () => {
    if (!sesion?.tiendaId) return;
    const { data } = await supabase
      .from("productos")
      .select("*")
      .eq("tienda_id", sesion.tiendaId)
      .eq("activo", true)
      .order("nombre");
    setProductos(data ?? []);
  }, [sesion]);

  const cargarVentasRecientes = useCallback(async () => {
    if (!sesion?.tiendaId) return;
    const { data } = await supabase
      .from("ventas")
      .select("*, variantes!inner(producto_id, productos!inner(tienda_id, nombre, precio))")
      .eq("variantes.productos.tienda_id", sesion.tiendaId)
      .order("fecha", { ascending: false })
      .limit(10);
    setVentasRecientes(
      (data ?? []).map((v: any) => ({ ...v, productos: v.variantes?.productos })) as any
    );
  }, [sesion]);

  useEffect(() => {
    cargarProductos();
    cargarVentasRecientes();
  }, [cargarProductos, cargarVentasRecientes]);

  useEffect(() => {
    if (!productoId) {
      setVariantes([]);
      setVarianteId("");
      return;
    }
    supabase
      .from("variantes")
      .select("*")
      .eq("producto_id", productoId)
      .order("talla")
      .then(({ data }) => {
        setVariantes(data ?? []);
        setVarianteId("");
      });
  }, [productoId]);

  useEffect(() => {
    if (!sesion?.tiendaId || busquedaCliente.trim().length < 2) {
      setClientesEncontrados([]);
      return;
    }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("clientes")
        .select("*")
        .eq("tienda_id", sesion.tiendaId)
        .or(`nombre.ilike.%${busquedaCliente}%,telefono.ilike.%${busquedaCliente}%,email.ilike.%${busquedaCliente}%`)
        .limit(5);
      setClientesEncontrados(data ?? []);
    }, 300);
    return () => clearTimeout(t);
  }, [busquedaCliente, sesion]);

  const varianteSel = variantes.find((v) => v.id === varianteId);

  async function registrarVenta(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMensaje(null);

    if (!varianteSel) {
      setError("Selecciona un producto y una variante.");
      return;
    }
    if (cantidad < 1 || cantidad > varianteSel.stock) {
      setError(`La cantidad debe ser entre 1 y el stock disponible (${varianteSel.stock}).`);
      return;
    }

    setGuardando(true);
    try {
      let clienteFinal = clienteId;

      if (nuevoCliente && (nuevoNombre.trim() || nuevoTelefono.trim())) {
        const { data: clienteCreado, error: errorCliente } = await supabase
          .from("clientes")
          .insert({
            tienda_id: sesion?.tiendaId,
            nombre: nuevoNombre.trim() || null,
            telefono: nuevoTelefono.trim() || null,
            email: nuevoEmail.trim() || null,
            fecha_nacimiento: nuevoNacimiento || null,
          })
          .select()
          .single();
        if (errorCliente) throw errorCliente;
        clienteFinal = clienteCreado.id;
      }

      // Registro atómico: revisa stock, descuenta y crea la venta en una sola operación
      // indivisible (evita que dos ventas simultáneas vendan la misma última unidad).
      const { error: errorVenta } = await supabase.rpc("fn_registrar_venta", {
        p_variante_id: varianteSel.id,
        p_cantidad: cantidad,
        p_cliente_id: clienteFinal,
        p_canal: canal,
      });
      if (errorVenta) throw errorVenta;

      setMensaje("Venta registrada y stock actualizado.");
      setProductoId("");
      setVarianteId("");
      setCantidad(1);
      setClienteId(null);
      setClienteNombre("");
      setBusquedaCliente("");
      setNuevoCliente(false);
      setNuevoNombre("");
      setNuevoTelefono("");
      setNuevoEmail("");
      setNuevoNacimiento("");
      cargarProductos();
      cargarVentasRecientes();
    } catch (err) {
      const detalle = mensajeErrorAmigable(err);
      setError(`No se pudo registrar la venta: ${detalle}`);
      cargarProductos();
      if (productoId) {
        const { data } = await supabase
          .from("variantes")
          .select("*")
          .eq("producto_id", productoId)
          .order("talla");
        setVariantes(data ?? []);
      }
    } finally {
      setGuardando(false);
    }
  }

  if (sesion && sesion.rol === "superadmin") {
    return <p className="text-berry">Esta sección es para administradores de tienda.</p>;
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-display text-2xl text-ink">Registrar venta</h1>

      <form onSubmit={registrarVenta} className="space-y-4 rounded-card border border-line bg-white p-5">
        <div>
          <label className="block text-sm text-inkSoft mb-1">Producto</label>
          <select
            required
            value={productoId}
            onChange={(e) => setProductoId(e.target.value)}
            className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
          >
            <option value="">Selecciona un producto</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.codigo})
              </option>
            ))}
          </select>
        </div>

        {productoId && (
          <div>
            <label className="block text-sm text-inkSoft mb-1">Talla / color</label>
            <select
              required
              value={varianteId}
              onChange={(e) => setVarianteId(e.target.value)}
              className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
            >
              <option value="">Selecciona una variante</option>
              {variantes.map((v) => (
                <option key={v.id} value={v.id} disabled={v.stock === 0}>
                  {v.talla ?? "—"} {v.color ? `· ${v.color}` : ""} (stock: {v.stock})
                </option>
              ))}
            </select>
          </div>
        )}

        {varianteSel && (
          <div>
            <label className="block text-sm text-inkSoft mb-1">Cantidad</label>
            <CampoNumero
              min={1}
              max={varianteSel.stock}
              valor={cantidad}
              onCambio={setCantidad}
              className="w-28 rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
            />
          </div>
        )}

        <div>
          <label className="block text-sm text-inkSoft mb-1">Canal</label>
          <select
            value={canal}
            onChange={(e) => setCanal(e.target.value)}
            className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="tienda">Tienda física</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div className="border-t border-line pt-4">
          <label className="block text-sm text-inkSoft mb-1">
            Cliente (opcional, útil para promociones futuras)
          </label>

          {clienteId ? (
            <div className="flex items-center justify-between rounded-card bg-tealSoft px-4 py-2.5">
              <span className="text-sm text-teal font-medium">{clienteNombre}</span>
              <button
                type="button"
                onClick={() => {
                  setClienteId(null);
                  setClienteNombre("");
                }}
                className="text-xs text-berry font-medium"
              >
                Quitar
              </button>
            </div>
          ) : !nuevoCliente ? (
            <div className="relative">
              <input
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                placeholder="Buscar por nombre, teléfono o correo…"
                className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
              />
              {clientesEncontrados.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-line rounded-card mt-1 shadow-card">
                  {clientesEncontrados.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setClienteId(c.id);
                        setClienteNombre(c.nombre ?? c.telefono ?? c.email ?? "Cliente");
                        setClientesEncontrados([]);
                        setBusquedaCliente("");
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-tealSoft"
                    >
                      {c.nombre ?? "—"} {c.telefono ? `· ${c.telefono}` : ""}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setNuevoCliente(true)}
                className="text-xs text-teal font-medium mt-2"
              >
                + Cargar cliente nuevo
              </button>
            </div>
          ) : (
            <div className="space-y-2 rounded-card border border-line p-3">
              <input
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Nombre"
                className="w-full rounded-card border border-line px-3 py-2 text-sm outline-none focus:border-teal"
              />
              <input
                value={nuevoTelefono}
                onChange={(e) => setNuevoTelefono(e.target.value)}
                placeholder="Teléfono"
                className="w-full rounded-card border border-line px-3 py-2 text-sm outline-none focus:border-teal"
              />
              <input
                type="email"
                value={nuevoEmail}
                onChange={(e) => setNuevoEmail(e.target.value)}
                placeholder="Correo (para promociones)"
                className="w-full rounded-card border border-line px-3 py-2 text-sm outline-none focus:border-teal"
              />
              <div>
                <label className="block text-xs text-inkSoft mb-1">Fecha de nacimiento (opcional)</label>
                <input
                  type="date"
                  value={nuevoNacimiento}
                  onChange={(e) => setNuevoNacimiento(e.target.value)}
                  className="w-full rounded-card border border-line px-3 py-2 text-sm outline-none focus:border-teal"
                />
              </div>
              <button
                type="button"
                onClick={() => setNuevoCliente(false)}
                className="text-xs text-berry font-medium"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {error && <p className="text-berry text-sm">{error}</p>}
        {mensaje && <p className="text-teal text-sm">{mensaje}</p>}

        <button
          type="submit"
          disabled={guardando || !varianteSel}
          className="w-full rounded-card bg-teal text-white font-medium py-3 shadow-card disabled:opacity-60"
        >
          {guardando ? "Registrando…" : "Registrar venta"}
        </button>
      </form>

      <div>
        <h2 className="font-medium text-ink mb-2">Últimas ventas</h2>
        {ventasRecientes.length === 0 ? (
          <p className="text-inkSoft text-sm">Todavía no hay ventas registradas.</p>
        ) : (
          <div className="space-y-2">
            {ventasRecientes.map((v) => {
              const conOferta =
                v.productos?.precio != null &&
                v.precio_unitario != null &&
                v.precio_unitario < v.productos.precio;
              return (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-card border border-line bg-white px-4 py-2.5 text-sm"
                >
                  <span className="text-ink">
                    {v.productos?.nombre ?? "Producto"} × {v.cantidad}
                    {conOferta && (
                      <span className="ml-2 rounded-full bg-berrySoft px-2 py-0.5 text-[10px] font-medium text-berry">
                        Oferta
                      </span>
                    )}
                  </span>
                  <span className="text-inkSoft text-xs">
                    Bs {(v.precio_unitario ?? 0).toFixed(2)} c/u ·{" "}
                    {new Date(v.fecha).toLocaleDateString("es-BO")} · Total Bs{" "}
                    {((v.precio_unitario ?? 0) * v.cantidad).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
