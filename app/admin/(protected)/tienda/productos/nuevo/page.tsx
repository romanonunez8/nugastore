"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Categoria } from "@/lib/supabase";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { mensajeErrorAmigable } from "@/lib/errors";
import { CampoNumero } from "@/components/admin/CampoNumero";

type VarianteNueva = { id: string; talla: string; color: string; stock: number };

export default function NuevoProductoPage() {
  const { sesion } = useAdminAuth();
  const router = useRouter();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [precio, setPrecio] = useState(0);
  const [variantes, setVariantes] = useState<VarianteNueva[]>([
    { id: crypto.randomUUID(), talla: "", color: "", stock: 0 },
  ]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sesion?.tiendaId) return;
    supabase
      .from("categorias")
      .select("*")
      .eq("tienda_id", sesion.tiendaId)
      .order("orden")
      .then(({ data }) => setCategorias(data ?? []));
  }, [sesion]);

  function actualizarVariante(id: string, campo: keyof VarianteNueva, valor: string | number) {
    setVariantes((prev) => prev.map((v) => (v.id === id ? { ...v, [campo]: valor } : v)));
  }

  function agregarFila() {
    setVariantes((prev) => [...prev, { id: crypto.randomUUID(), talla: "", color: "", stock: 0 }]);
  }

  function quitarFila(id: string) {
    setVariantes((prev) => prev.filter((v) => v.id !== id));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sesion?.tiendaId) return;
    setError(null);
    setGuardando(true);

    try {
      const { data: producto, error: errorInsert } = await supabase
        .from("productos")
        .insert({
          tienda_id: sesion.tiendaId,
          codigo,
          nombre,
          descripcion: descripcion || null,
          categoria_id: categoriaId || null,
          precio,
          activo: true,
        })
        .select()
        .single();

      if (errorInsert || !producto) throw errorInsert ?? new Error("No se pudo crear el producto.");

      // Las filas de variantes que tengan al menos talla o color cargados se guardan.
      // Las vacías (por ejemplo si dejaste la fila de más sin completar) se ignoran solas.
      const variantesValidas = variantes.filter((v) => v.talla.trim() || v.color.trim());
      if (variantesValidas.length > 0) {
        const { error: errorVariantes } = await supabase.from("variantes").insert(
          variantesValidas.map((v) => ({
            producto_id: producto.id,
            talla: v.talla.trim() || null,
            color: v.color.trim() || null,
            stock: v.stock,
          }))
        );
        if (errorVariantes) throw errorVariantes;
      }

      router.replace(`/admin/tienda/productos/${producto.id}?creado=1`);
    } catch (err) {
      setError(mensajeErrorAmigable(err));
      setGuardando(false);
    }
  }

  if (sesion && sesion.rol !== "admin_tienda") {
    return <p className="text-berry">Esta sección es solo para el administrador de la tienda.</p>;
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-display text-2xl text-ink">Nuevo producto</h1>

      <form onSubmit={onSubmit} className="space-y-4 rounded-card border border-line bg-white p-5">
        <div>
          <label className="block text-sm text-inkSoft mb-1">
            Código <span className="text-berry">*</span>
          </label>
          <input
            required
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="RF-001"
            className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
          />
        </div>

        <div>
          <label className="block text-sm text-inkSoft mb-1">
            Nombre <span className="text-berry">*</span>
          </label>
          <input
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
          />
        </div>

        <div>
          <label className="block text-sm text-inkSoft mb-1">Descripción</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-inkSoft mb-1">Categoría</label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
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
            <label className="block text-sm text-inkSoft mb-1">
              Precio (Bs) <span className="text-berry">*</span>
            </label>
            <CampoNumero
              required
              min={0}
              step="0.01"
              valor={precio}
              onCambio={setPrecio}
              className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
            />
          </div>
        </div>

        <div className="border-t border-line pt-4">
          <p className="text-sm text-inkSoft mb-1">
            Variantes (talla / color / stock inicial) — opcional
          </p>
          <p className="text-xs text-inkSoft mb-3">
            Si el producto no tiene tallas ni colores, dejá esta sección vacía y avanzá — podés
            agregarlas después desde la edición del producto.
          </p>

          <div className="space-y-2">
            {variantes.map((v) => (
              <div key={v.id} className="flex flex-wrap items-end gap-2">
                <div>
                  <label className="block text-xs text-inkSoft mb-1">Talla</label>
                  <input
                    value={v.talla}
                    onChange={(e) => actualizarVariante(v.id, "talla", e.target.value)}
                    placeholder="S, M, L…"
                    className="w-24 rounded-card border border-line px-3 py-2 text-sm outline-none focus:border-teal"
                  />
                </div>
                <div>
                  <label className="block text-xs text-inkSoft mb-1">Color</label>
                  <input
                    value={v.color}
                    onChange={(e) => actualizarVariante(v.id, "color", e.target.value)}
                    placeholder="Opcional"
                    className="w-28 rounded-card border border-line px-3 py-2 text-sm outline-none focus:border-teal"
                  />
                </div>
                <div>
                  <label className="block text-xs text-inkSoft mb-1">Stock</label>
                  <CampoNumero
                    min={0}
                    valor={v.stock}
                    onCambio={(n) => actualizarVariante(v.id, "stock", n)}
                    className="w-20 rounded-card border border-line px-3 py-2 text-sm outline-none focus:border-teal"
                  />
                </div>
                {variantes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => quitarFila(v.id)}
                    className="text-xs text-berry font-medium pb-2.5"
                  >
                    Quitar
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={agregarFila}
            className="mt-3 text-sm font-medium text-teal"
          >
            + Agregar otra variante
          </button>
        </div>

        {error && <p className="text-berry text-sm">{error}</p>}

        <button
          type="submit"
          disabled={guardando}
          className="rounded-card bg-teal text-white font-medium px-5 py-2.5 shadow-card disabled:opacity-60"
        >
          {guardando ? "Creando…" : "Crear producto"}
        </button>
        <p className="text-xs text-inkSoft">
          Después de crearlo vas a poder agregar fotos desde la pantalla de edición.
        </p>
      </form>
    </div>
  );
}
