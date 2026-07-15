"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, type Producto, type Categoria } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import CategoryFilter from "@/components/CategoryFilter";

export default function InicioPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      setCargando(true);

      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase
          .from("categorias")
          .select("*")
          .eq("activa", true)
          .order("orden", { ascending: true }),
        supabase
          .from("productos")
          .select(
            "*, categorias(*), variantes(*), ofertas(*)"
          )
          .eq("activo", true),
      ]);

      setCategorias(cats ?? []);
      setProductos(prods ?? []);
      setCargando(false);
    }
    cargar();
  }, []);

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const coincideCategoria = !categoriaActiva || p.categoria_id === categoriaActiva;
      const coincideBusqueda =
        !busqueda ||
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.codigo.toLowerCase().includes(busqueda.toLowerCase());
      const tieneStock = (p.variantes ?? []).some((v) => v.stock > 0);
      return coincideCategoria && coincideBusqueda && tieneStock;
    });
  }, [productos, categoriaActiva, busqueda]);

  return (
    <main className="min-h-screen pb-10">
      <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 pt-5">
          <div className="flex items-baseline justify-between">
            <h1 className="font-display text-2xl italic text-ink">Nugastore</h1>
            <span className="font-body text-xs text-inkSoft">Santa Cruz, Bolivia</span>
          </div>

          <div className="mt-4 mb-3">
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o código..."
              className="w-full rounded-full border border-line bg-white px-4 py-2.5 font-body text-sm text-ink placeholder:text-inkSoft/70 focus-visible:outline-teal"
            />
          </div>
        </div>

        <CategoryFilter
          categorias={categorias}
          activa={categoriaActiva}
          onChange={setCategoriaActiva}
        />
      </header>

      <section className="mx-auto max-w-5xl px-4 pt-5">
        {cargando ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4.5] animate-pulse rounded-card bg-white border border-line/60"
              />
            ))}
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <p className="font-display text-lg italic text-ink">
              No encontramos productos aquí todavía
            </p>
            <p className="font-body text-sm text-inkSoft">
              Prueba con otra categoría o revisa más tarde.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {productosFiltrados.map((p) => (
              <ProductCard key={p.id} producto={p} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
