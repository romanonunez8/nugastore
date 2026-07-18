"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, type Categoria } from "@/lib/supabase";
import { useAdminAuth } from "@/lib/admin-auth-context";

export default function CategoriasPage() {
  const { sesion } = useAdminAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nombreNueva, setNombreNueva] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    if (!sesion?.tiendaId) return;
    setCargando(true);
    const { data } = await supabase
      .from("categorias")
      .select("*")
      .eq("tienda_id", sesion.tiendaId)
      .order("orden");
    setCategorias(data ?? []);
    setCargando(false);
  }, [sesion]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!sesion?.tiendaId || !nombreNueva.trim()) return;
    setGuardando(true);
    const siguienteOrden = categorias.length;
    await supabase.from("categorias").insert({
      tienda_id: sesion.tiendaId,
      nombre: nombreNueva.trim(),
      orden: siguienteOrden,
      activa: true,
    });
    setNombreNueva("");
    setGuardando(false);
    cargar();
  }

  async function renombrar(id: string, nombre: string) {
    await supabase.from("categorias").update({ nombre }).eq("id", id);
  }

  async function toggleActiva(cat: Categoria) {
    await supabase.from("categorias").update({ activa: !cat.activa }).eq("id", cat.id);
    cargar();
  }

  async function mover(index: number, direccion: -1 | 1) {
    const destino = index + direccion;
    if (destino < 0 || destino >= categorias.length) return;
    const actual = categorias[index];
    const otra = categorias[destino];

    await Promise.all([
      supabase.from("categorias").update({ orden: otra.orden }).eq("id", actual.id),
      supabase.from("categorias").update({ orden: actual.orden }).eq("id", otra.id),
    ]);
    cargar();
  }

  if (sesion && sesion.rol !== "admin_tienda") {
    return <p className="text-berry">Esta sección es solo para el administrador de la tienda.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-ink">Categorías</h1>

      <form onSubmit={crear} className="flex gap-2">
        <input
          value={nombreNueva}
          onChange={(e) => setNombreNueva(e.target.value)}
          placeholder="Ej: Accesorios"
          className="flex-1 rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
        />
        <button
          type="submit"
          disabled={guardando || !nombreNueva.trim()}
          className="rounded-card bg-teal text-white font-medium px-5 py-2.5 shadow-card disabled:opacity-60"
        >
          Agregar
        </button>
      </form>

      {cargando ? (
        <p className="text-inkSoft">Cargando…</p>
      ) : categorias.length === 0 ? (
        <p className="text-inkSoft">Todavía no tenés categorías.</p>
      ) : (
        <div className="space-y-2">
          {categorias.map((cat, i) => (
            <div
              key={cat.id}
              className="flex items-center gap-2 rounded-card border border-line bg-white px-3 py-2.5"
            >
              <div className="flex flex-col">
                <button
                  onClick={() => mover(i, -1)}
                  disabled={i === 0}
                  className="text-inkSoft text-xs disabled:opacity-30"
                  aria-label="Subir"
                >
                  ▲
                </button>
                <button
                  onClick={() => mover(i, 1)}
                  disabled={i === categorias.length - 1}
                  className="text-inkSoft text-xs disabled:opacity-30"
                  aria-label="Bajar"
                >
                  ▼
                </button>
              </div>

              <input
                defaultValue={cat.nombre}
                onBlur={(e) => {
                  if (e.target.value.trim() && e.target.value !== cat.nombre) {
                    renombrar(cat.id, e.target.value.trim());
                  }
                }}
                className="flex-1 bg-transparent outline-none text-ink font-medium"
              />

              <button
                onClick={() => toggleActiva(cat)}
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  cat.activa ? "bg-tealSoft text-teal" : "bg-berrySoft text-berry"
                }`}
              >
                {cat.activa ? "Activa" : "Desactivada"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
