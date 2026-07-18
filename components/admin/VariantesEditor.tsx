"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, type Variante } from "@/lib/supabase";

export function VariantesEditor({ productoId }: { productoId: string }) {
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [cargando, setCargando] = useState(true);
  const [talla, setTalla] = useState("");
  const [color, setColor] = useState("");
  const [stock, setStock] = useState(0);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await supabase
      .from("variantes")
      .select("*")
      .eq("producto_id", productoId)
      .order("talla");
    setVariantes(data ?? []);
    setCargando(false);
  }, [productoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (!talla.trim() && !color.trim()) return;
    await supabase.from("variantes").insert({
      producto_id: productoId,
      talla: talla.trim() || null,
      color: color.trim() || null,
      stock,
    });
    setTalla("");
    setColor("");
    setStock(0);
    cargar();
  }

  async function actualizarStock(id: string, nuevoStock: number) {
    await supabase.from("variantes").update({ stock: Math.max(0, nuevoStock) }).eq("id", id);
    cargar();
  }

  async function eliminar(id: string) {
    await supabase.from("variantes").delete().eq("id", id);
    cargar();
  }

  return (
    <div>
      <label className="block text-sm text-inkSoft mb-2">Variantes (talla / color / stock)</label>

      {cargando ? (
        <p className="text-inkSoft text-sm">Cargando…</p>
      ) : variantes.length === 0 ? (
        <p className="text-inkSoft text-sm mb-3">Todavía no agregaste variantes.</p>
      ) : (
        <div className="space-y-2 mb-3">
          {variantes.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-3 rounded-card border border-line bg-white px-3 py-2"
            >
              <span className="flex-1 text-sm text-ink">
                {v.talla ?? "—"} {v.color ? `· ${v.color}` : ""}
              </span>
              <input
                type="number"
                min={0}
                value={v.stock}
                onChange={(e) => actualizarStock(v.id, parseInt(e.target.value || "0", 10))}
                className="w-20 rounded-card border border-line px-2 py-1 text-sm outline-none focus:border-teal"
              />
              <button onClick={() => eliminar(v.id)} className="text-berry text-xs font-medium">
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={agregar} className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-xs text-inkSoft mb-1">Talla</label>
          <input
            value={talla}
            onChange={(e) => setTalla(e.target.value)}
            placeholder="S, M, L…"
            className="w-24 rounded-card border border-line px-3 py-2 text-sm outline-none focus:border-teal"
          />
        </div>
        <div>
          <label className="block text-xs text-inkSoft mb-1">Color</label>
          <input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="Opcional"
            className="w-28 rounded-card border border-line px-3 py-2 text-sm outline-none focus:border-teal"
          />
        </div>
        <div>
          <label className="block text-xs text-inkSoft mb-1">Stock</label>
          <input
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(parseInt(e.target.value || "0", 10))}
            className="w-20 rounded-card border border-line px-3 py-2 text-sm outline-none focus:border-teal"
          />
        </div>
        <button
          type="submit"
          className="rounded-card bg-teal text-white text-sm font-medium px-4 py-2 shadow-card"
        >
          + Agregar
        </button>
      </form>
    </div>
  );
}
