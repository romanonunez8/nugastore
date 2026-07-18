"use client";

import { useEffect, useState, useCallback } from "react";
import {
  supabase,
  type Oferta,
  type Producto,
  type Categoria,
} from "@/lib/supabase";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { mensajeErrorAmigable } from "@/lib/errors";

function nombreObjetivo(
  oferta: Oferta,
  productos: Producto[],
  categorias: Categoria[]
) {
  if (oferta.tipo === "producto") {
    return productos.find((p) => p.id === oferta.producto_id)?.nombre ?? "Producto eliminado";
  }
  if (oferta.tipo === "categoria") {
    return `Categoría: ${categorias.find((c) => c.id === oferta.categoria_id)?.nombre ?? "—"}`;
  }
  return "Toda la tienda";
}

function estadoOferta(oferta: Oferta) {
  const ahora = new Date();
  const inicia = new Date(oferta.inicia);
  const termina = new Date(oferta.termina);
  if (ahora < inicia) return { texto: "Programada", clase: "bg-marigold/20 text-marigoldDark" };
  if (ahora > termina) return { texto: "Vencida", clase: "bg-line text-inkSoft" };
  return { texto: "Activa", clase: "bg-tealSoft text-teal" };
}

export default function OfertasPage() {
  const { sesion } = useAdminAuth();
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);

  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<"producto" | "categoria" | "tienda">("producto");
  const [productoId, setProductoId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [modoDescuento, setModoDescuento] = useState<"porcentaje" | "fijo">("porcentaje");
  const [porcentaje, setPorcentaje] = useState<number>(10);
  const [precioFijo, setPrecioFijo] = useState<number>(0);
  const [inicia, setInicia] = useState(() => new Date().toISOString().slice(0, 16));
  const [termina, setTermina] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!sesion?.tiendaId) return;
    setCargando(true);

    const [{ data: prods }, { data: cats }, { data: todas }] = await Promise.all([
      supabase.from("productos").select("*").eq("tienda_id", sesion.tiendaId).order("nombre"),
      supabase.from("categorias").select("*").eq("tienda_id", sesion.tiendaId).order("orden"),
      supabase.from("ofertas").select("*"),
    ]);

    // Las ofertas no tienen todas un tienda_id directo (las de categoría/producto no lo tienen),
    // así que filtramos del lado del cliente quedándonos solo con las que pertenecen a esta tienda.
    const idsProductos = new Set((prods ?? []).map((p) => p.id));
    const idsCategorias = new Set((cats ?? []).map((c) => c.id));
    const propias = (todas ?? []).filter(
      (o) =>
        (o.tipo === "tienda" && o.tienda_id === sesion.tiendaId) ||
        (o.tipo === "categoria" && o.categoria_id && idsCategorias.has(o.categoria_id)) ||
        (o.tipo === "producto" && o.producto_id && idsProductos.has(o.producto_id))
    );

    setOfertas(propias);
    setProductos(prods ?? []);
    setCategorias(cats ?? []);
    setCargando(false);
  }, [sesion]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function limpiar() {
    setTipo("producto");
    setProductoId("");
    setCategoriaId("");
    setModoDescuento("porcentaje");
    setPorcentaje(10);
    setPrecioFijo(0);
    setTermina("");
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!sesion?.tiendaId) return;
    setError(null);

    if (tipo === "producto" && !productoId) {
      setError("Selecciona un producto.");
      return;
    }
    if (tipo === "categoria" && !categoriaId) {
      setError("Selecciona una categoría.");
      return;
    }
    if (!termina) {
      setError("Selecciona cuándo termina la oferta.");
      return;
    }

    setGuardando(true);
    try {
      const { error: errorInsert } = await supabase.from("ofertas").insert({
        tipo,
        producto_id: tipo === "producto" ? productoId : null,
        categoria_id: tipo === "categoria" ? categoriaId : null,
        tienda_id: tipo === "tienda" ? sesion.tiendaId : null,
        precio_oferta: modoDescuento === "fijo" ? precioFijo : null,
        porcentaje: modoDescuento === "porcentaje" ? porcentaje : null,
        inicia: new Date(inicia).toISOString(),
        termina: new Date(termina).toISOString(),
      });
      if (errorInsert) throw errorInsert;

      limpiar();
      setAbierto(false);
      cargar();
    } catch (err) {
      setError(`No se pudo crear la oferta: ${mensajeErrorAmigable(err)}`);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar esta oferta?")) return;
    await supabase.from("ofertas").delete().eq("id", id);
    cargar();
  }

  if (sesion && sesion.rol !== "admin_tienda") {
    return <p className="text-berry">Esta sección es solo para el administrador de la tienda.</p>;
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Ofertas</h1>
        {!abierto && (
          <button
            onClick={() => setAbierto(true)}
            className="rounded-card bg-teal text-white font-medium px-5 py-2.5 shadow-card"
          >
            + Nueva oferta
          </button>
        )}
      </div>

      {abierto && (
        <form onSubmit={crear} className="space-y-4 rounded-card border border-line bg-white p-5">
          <div>
            <label className="block text-sm text-inkSoft mb-1">Aplicar a</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as typeof tipo)}
              className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
            >
              <option value="producto">Un producto específico</option>
              <option value="categoria">Toda una categoría</option>
              <option value="tienda">Toda la tienda</option>
            </select>
          </div>

          {tipo === "producto" && (
            <div>
              <label className="block text-sm text-inkSoft mb-1">Producto</label>
              <select
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
          )}

          {tipo === "categoria" && (
            <div>
              <label className="block text-sm text-inkSoft mb-1">Categoría</label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
              >
                <option value="">Selecciona una categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm text-inkSoft mb-1">Tipo de descuento</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center gap-1.5 text-sm text-ink">
                <input
                  type="radio"
                  checked={modoDescuento === "porcentaje"}
                  onChange={() => setModoDescuento("porcentaje")}
                />
                Porcentaje
              </label>
              <label className="flex items-center gap-1.5 text-sm text-ink">
                <input
                  type="radio"
                  checked={modoDescuento === "fijo"}
                  onChange={() => setModoDescuento("fijo")}
                />
                Precio fijo (solo para 1 producto)
              </label>
            </div>
            {modoDescuento === "porcentaje" ? (
              <input
                type="number"
                min={1}
                max={90}
                value={porcentaje}
                onChange={(e) => setPorcentaje(parseFloat(e.target.value || "0"))}
                className="w-28 rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
              />
            ) : (
              <input
                type="number"
                min={0}
                step="0.01"
                value={precioFijo}
                onChange={(e) => setPrecioFijo(parseFloat(e.target.value || "0"))}
                disabled={tipo !== "producto"}
                className="w-32 rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal disabled:opacity-50"
                placeholder="Bs"
              />
            )}
            {modoDescuento === "fijo" && tipo !== "producto" && (
              <p className="text-xs text-berry mt-1">
                El precio fijo solo tiene sentido para un producto específico. Para
                categoría/tienda, usa porcentaje.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-inkSoft mb-1">Empieza</label>
              <input
                type="datetime-local"
                value={inicia}
                onChange={(e) => setInicia(e.target.value)}
                className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-sm text-inkSoft mb-1">Termina</label>
              <input
                type="datetime-local"
                required
                value={termina}
                onChange={(e) => setTermina(e.target.value)}
                className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
              />
            </div>
          </div>

          {error && <p className="text-berry text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={guardando}
              className="rounded-card bg-teal text-white font-medium px-5 py-2.5 shadow-card disabled:opacity-60"
            >
              {guardando ? "Creando…" : "Crear oferta"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAbierto(false);
                limpiar();
              }}
              className="text-inkSoft text-sm font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {cargando ? (
        <p className="text-inkSoft">Cargando…</p>
      ) : ofertas.length === 0 ? (
        <p className="text-inkSoft text-sm">Todavía no creaste ninguna oferta.</p>
      ) : (
        <div className="space-y-2">
          {ofertas.map((o) => {
            const estado = estadoOferta(o);
            return (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-card border border-line bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium text-ink text-sm">
                    {nombreObjetivo(o, productos, categorias)}
                  </p>
                  <p className="text-xs text-inkSoft">
                    {o.porcentaje != null ? `${o.porcentaje}% off` : `Precio fijo Bs ${o.precio_oferta}`}
                    {" · "}
                    Hasta {new Date(o.termina).toLocaleDateString("es-BO")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estado.clase}`}>
                    {estado.texto}
                  </span>
                  <button
                    onClick={() => eliminar(o.id)}
                    className="text-xs text-berry font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
