"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase, type Categoria } from "@/lib/supabase";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { mensajeErrorAmigable } from "@/lib/errors";
import { AccionesFila, AvisoFlotante, DialogoConfirmar } from "@/components/admin/AccionesFila";

// Al tocar eliminar: si la categoría tiene productos no se borra (quedarían
// sin categoría); se ofrece desactivarla.
type Borrado = { categoria: Categoria; productos: number } | null;

export default function CategoriasPage() {
  const { sesion } = useAdminAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nombreNueva, setNombreNueva] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [borrado, setBorrado] = useState<Borrado>(null);
  const [procesando, setProcesando] = useState(false);
  const [errorBorrado, setErrorBorrado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const campos = useRef<Record<string, HTMLInputElement | null>>({});

  // El lápiz pone el cursor en el nombre para renombrarlo ahí mismo
  function editar(id: string) {
    const campo = campos.current[id];
    if (!campo) return;
    campo.focus();
    campo.select();
  }

  async function pedirEliminar(cat: Categoria) {
    setErrorBorrado(null);
    const { count } = await supabase
      .from("productos")
      .select("id", { count: "exact", head: true })
      .eq("categoria_id", cat.id);
    setBorrado({ categoria: cat, productos: count ?? 0 });
  }

  async function confirmarEliminar() {
    if (!borrado) return;
    const cat = borrado.categoria;
    setProcesando(true);
    setErrorBorrado(null);

    if (borrado.productos > 0) {
      // Tiene productos: solo se desactiva
      const { error } = await supabase.from("categorias").update({ activa: false }).eq("id", cat.id);
      setProcesando(false);
      if (error) return setErrorBorrado(mensajeErrorAmigable(error));
      setCategorias((lista) => lista.map((c) => (c.id === cat.id ? { ...c, activa: false } : c)));
      setBorrado(null);
      setAviso(`"${cat.nombre}" fue desactivada.`);
      return;
    }

    const { data, error } = await supabase.from("categorias").delete().eq("id", cat.id).select("id");
    setProcesando(false);
    if (error) {
      setErrorBorrado(
        error.code === "23503"
          ? "Esta categoría está en uso (por ejemplo, en una oferta). Desactivala en lugar de eliminarla."
          : mensajeErrorAmigable(error)
      );
      return;
    }
    if (!data || data.length === 0) return setErrorBorrado("No tenés permiso para eliminar esta categoría.");
    setCategorias((lista) => lista.filter((c) => c.id !== cat.id));
    setBorrado(null);
    setAviso(`"${cat.nombre}" fue eliminada.`);
  }

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
                ref={(el) => {
                  campos.current[cat.id] = el;
                }}
                aria-label={`Nombre de la categoría ${cat.nombre}`}
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

              <AccionesFila
                nombre={cat.nombre}
                onEditar={() => editar(cat.id)}
                onEliminar={() => pedirEliminar(cat)}
              />
            </div>
          ))}
        </div>
      )}

      <AvisoFlotante texto={aviso} onCerrar={() => setAviso(null)} />

      {borrado &&
        (borrado.productos === 0 ? (
          <DialogoConfirmar
            titulo="¿Eliminar esta categoría?"
            textoConfirmar="Eliminar"
            textoProcesando="Eliminando…"
            procesando={procesando}
            error={errorBorrado}
            onConfirmar={confirmarEliminar}
            onCancelar={() => setBorrado(null)}
          >
            Vas a eliminar <span className="font-medium text-ink">{borrado.categoria.nombre}</span>. No tiene
            productos, así que no afecta a tu catálogo.
          </DialogoConfirmar>
        ) : (
          <DialogoConfirmar
            titulo="Esta categoría tiene productos"
            tono="normal"
            textoConfirmar={borrado.categoria.activa ? "Desactivar" : "Ya está desactivada"}
            textoProcesando="Desactivando…"
            deshabilitarConfirmar={!borrado.categoria.activa}
            procesando={procesando}
            error={errorBorrado}
            onConfirmar={confirmarEliminar}
            onCancelar={() => setBorrado(null)}
          >
            <span className="font-medium text-ink">{borrado.categoria.nombre}</span> tiene {borrado.productos}{" "}
            {borrado.productos === 1 ? "producto" : "productos"}. Para eliminarla, primero mové esos productos a otra
            categoría. Mientras tanto podés desactivarla para que no se muestre en la tienda.
          </DialogoConfirmar>
        ))}
    </div>
  );
}
