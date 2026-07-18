"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, type ProductoFoto } from "@/lib/supabase";

const BUCKET = "productos";

export function CarruselFotos({ tiendaId, productoId }: { tiendaId: string; productoId: string }) {
  const [fotos, setFotos] = useState<ProductoFoto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await supabase
      .from("producto_fotos")
      .select("*")
      .eq("producto_id", productoId)
      .order("orden");
    setFotos(data ?? []);
    setCargando(false);
  }, [productoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function onSeleccionar(e: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? []);
    if (archivos.length === 0) return;

    setError(null);
    setSubiendo(true);
    try {
      let orden = fotos.length;
      for (const archivo of archivos) {
        const extension = archivo.name.split(".").pop();
        const ruta = `${tiendaId}/${productoId}/${crypto.randomUUID()}.${extension}`;

        const { error: errorSubida } = await supabase.storage.from(BUCKET).upload(ruta, archivo);
        if (errorSubida) throw errorSubida;

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(ruta);

        await supabase.from("producto_fotos").insert({
          producto_id: productoId,
          url: data.publicUrl,
          orden: orden++,
        });
      }
      await cargar();
    } catch (err) {
      setError("No se pudieron subir una o más fotos. Intenta de nuevo.");
    } finally {
      setSubiendo(false);
      e.target.value = "";
    }
  }

  async function eliminar(foto: ProductoFoto) {
    await supabase.from("producto_fotos").delete().eq("id", foto.id);
    cargar();
  }

  async function mover(index: number, direccion: -1 | 1) {
    const destino = index + direccion;
    if (destino < 0 || destino >= fotos.length) return;
    const actual = fotos[index];
    const otra = fotos[destino];

    await Promise.all([
      supabase.from("producto_fotos").update({ orden: otra.orden }).eq("id", actual.id),
      supabase.from("producto_fotos").update({ orden: actual.orden }).eq("id", otra.id),
    ]);
    cargar();
  }

  return (
    <div>
      <label className="block text-sm text-inkSoft mb-2">Fotos (carrusel)</label>

      {cargando ? (
        <p className="text-inkSoft text-sm">Cargando fotos…</p>
      ) : (
        <div className="flex flex-wrap gap-3 mb-3">
          {fotos.map((foto, i) => (
            <div key={foto.id} className="relative w-24 h-24 rounded-card overflow-hidden border border-line group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={foto.url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-ink/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity">
                <div className="flex gap-1">
                  <button
                    onClick={() => mover(i, -1)}
                    disabled={i === 0}
                    className="text-white text-xs px-1.5 disabled:opacity-30"
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => mover(i, 1)}
                    disabled={i === fotos.length - 1}
                    className="text-white text-xs px-1.5 disabled:opacity-30"
                  >
                    ▶
                  </button>
                </div>
                <button onClick={() => eliminar(foto)} className="text-berry text-xs font-medium">
                  Eliminar
                </button>
              </div>
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-marigold text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                  Portada
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <label className="inline-block cursor-pointer text-sm font-medium text-teal">
        {subiendo ? "Subiendo…" : "+ Agregar fotos desde el dispositivo"}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onSeleccionar}
          disabled={subiendo}
        />
      </label>
      {error && <p className="text-berry text-xs mt-1">{error}</p>}
    </div>
  );
}
