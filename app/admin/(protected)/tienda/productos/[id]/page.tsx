"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase, type Categoria, type Producto } from "@/lib/supabase";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { CarruselFotos } from "@/components/admin/CarruselFotos";
import { VariantesEditor } from "@/components/admin/VariantesEditor";

function EditarProductoContenido() {
  const { id } = useParams<{ id: string }>();
  const { sesion } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mostrarExito, setMostrarExito] = useState(searchParams.get("creado") === "1");

  const [producto, setProducto] = useState<Producto | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [precioTexto, setPrecioTexto] = useState("0");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eliminado, setEliminado] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await supabase.from("productos").select("*").eq("id", id).single();
    setProducto(data);
    if (data) setPrecioTexto(String(data.precio));
    setCargando(false);
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!mostrarExito) return;
    const t = setTimeout(() => setMostrarExito(false), 4000);
    return () => clearTimeout(t);
  }, [mostrarExito]);

  useEffect(() => {
    if (!sesion?.tiendaId) return;
    supabase
      .from("categorias")
      .select("*")
      .eq("tienda_id", sesion.tiendaId)
      .order("orden")
      .then(({ data }) => setCategorias(data ?? []));
  }, [sesion]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!producto) return;
    setError(null);
    setGuardando(true);

    const precioNumerico = parseFloat(precioTexto || "0");

    const { error: errorUpdate } = await supabase
      .from("productos")
      .update({
        codigo: producto.codigo,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        categoria_id: producto.categoria_id,
        precio: precioNumerico,
        activo: producto.activo,
        destacado: producto.destacado,
      })
      .eq("id", producto.id);

    setGuardando(false);
    if (errorUpdate) {
      setError("No se pudo guardar. Revisa que el código no esté repetido.");
    } else {
      setProducto({ ...producto, precio: precioNumerico });
      setMostrarExito(true);
    }
  }

  async function eliminar() {
    if (!producto) return;
    if (!confirm(`¿Eliminar "${producto.nombre}" definitivamente? Esta acción no se puede deshacer.`)) return;
    await supabase.from("productos").delete().eq("id", producto.id);
    setEliminado(true);
    router.replace("/admin/tienda/productos");
  }

  if (cargando) return <p className="text-inkSoft">Cargando…</p>;
  if (!producto || eliminado) return <p className="text-berry">Producto no encontrado.</p>;
  if (sesion && sesion.rol === "editor") {
    return <p className="text-berry">Esta sección es solo para el administrador de la tienda.</p>;
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Editar producto</h1>
        <button onClick={eliminar} className="text-sm font-medium text-berry">
          Eliminar producto
        </button>
      </div>

      {mostrarExito && (
        <div className="rounded-card bg-tealSoft text-teal text-sm px-4 py-3 font-medium">
          ✓ Producto guardado correctamente.
        </div>
      )}

      <form onSubmit={guardar} className="space-y-4 rounded-card border border-line bg-white p-5">
        <div>
          <label className="block text-sm text-inkSoft mb-1">Código</label>
          <input
            required
            value={producto.codigo}
            onChange={(e) => setProducto({ ...producto, codigo: e.target.value })}
            className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
          />
        </div>

        <div>
          <label className="block text-sm text-inkSoft mb-1">Nombre</label>
          <input
            required
            value={producto.nombre}
            onChange={(e) => setProducto({ ...producto, nombre: e.target.value })}
            className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
          />
        </div>

        <div>
          <label className="block text-sm text-inkSoft mb-1">Descripción</label>
          <textarea
            value={producto.descripcion ?? ""}
            onChange={(e) => setProducto({ ...producto, descripcion: e.target.value })}
            rows={3}
            className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-inkSoft mb-1">Categoría</label>
            <select
              value={producto.categoria_id ?? ""}
              onChange={(e) => setProducto({ ...producto, categoria_id: e.target.value || null })}
              className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
            >
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-inkSoft mb-1">Precio (Bs)</label>
            <input
              required
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={precioTexto}
              onChange={(e) => setPrecioTexto(e.target.value)}
              className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={producto.activo}
              onChange={(e) => setProducto({ ...producto, activo: e.target.checked })}
            />
            Activo (visible en la tienda)
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={producto.destacado ?? false}
              onChange={(e) => setProducto({ ...producto, destacado: e.target.checked })}
            />
            Destacado en el inicio
          </label>
        </div>

        {error && <p className="text-berry text-sm">{error}</p>}

        <button
          type="submit"
          disabled={guardando}
          className="rounded-card bg-teal text-white font-medium px-5 py-2.5 shadow-card disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>

      <div className="rounded-card border border-line bg-white p-5">
        <CarruselFotos tiendaId={producto.tienda_id} productoId={producto.id} />
      </div>

      <div className="rounded-card border border-line bg-white p-5">
        <VariantesEditor productoId={producto.id} />
      </div>
    </div>
  );
}

export default function EditarProductoPage() {
  return (
    <Suspense fallback={<p className="text-inkSoft">Cargando…</p>}>
      <EditarProductoContenido />
    </Suspense>
  );
}
