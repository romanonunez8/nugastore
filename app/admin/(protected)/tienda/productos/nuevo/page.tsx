"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Categoria } from "@/lib/supabase";
import { useAdminAuth } from "@/lib/admin-auth-context";

export default function NuevoProductoPage() {
  const { sesion } = useAdminAuth();
  const router = useRouter();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [precioTexto, setPrecioTexto] = useState("0");
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sesion?.tiendaId) return;
    setError(null);
    setGuardando(true);

    const { data, error: errorInsert } = await supabase
      .from("productos")
      .insert({
        tienda_id: sesion.tiendaId,
        codigo,
        nombre,
        descripcion: descripcion || null,
        categoria_id: categoriaId || null,
        precio: parseFloat(precioTexto || "0"),
        activo: true,
      })
      .select()
      .single();

    setGuardando(false);

    if (errorInsert || !data) {
      setError("No se pudo crear el producto. Revisa que el código no esté repetido.");
      return;
    }

    router.replace(`/admin/tienda/productos/${data.id}?creado=1`);
  }

  if (sesion && sesion.rol !== "admin_tienda") {
    return <p className="text-berry">Esta sección es solo para el administrador de la tienda.</p>;
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-display text-2xl text-ink">Nuevo producto</h1>

      <form onSubmit={onSubmit} className="space-y-4 rounded-card border border-line bg-white p-5">
        <div>
          <label className="block text-sm text-inkSoft mb-1">Código</label>
          <input
            required
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="RF-001"
            className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
          />
        </div>

        <div>
          <label className="block text-sm text-inkSoft mb-1">Nombre</label>
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

        {error && <p className="text-berry text-sm">{error}</p>}

        <button
          type="submit"
          disabled={guardando}
          className="rounded-card bg-teal text-white font-medium px-5 py-2.5 shadow-card disabled:opacity-60"
        >
          {guardando ? "Creando…" : "Crear y continuar"}
        </button>
        <p className="text-xs text-inkSoft">
          Después de crearlo vas a poder agregar fotos y variantes.
        </p>
      </form>
    </div>
  );
}
