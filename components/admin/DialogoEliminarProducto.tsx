"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { mensajeErrorAmigable } from "@/lib/errors";
import { DialogoConfirmar } from "@/components/admin/AccionesFila";

type ProductoBasico = { id: string; nombre: string; codigo: string; activo: boolean };

/**
 * Confirma y elimina un producto. Si el producto ya tiene ventas registradas
 * (la base de datos responde con el código 23503), no se borra: se ofrece
 * desactivarlo para que deje de verse en la tienda sin perder el historial.
 * Se usa en Productos e Inventario.
 */
export default function DialogoEliminarProducto({
  producto,
  onCerrar,
  onEliminado,
  onDesactivado,
}: {
  producto: ProductoBasico;
  onCerrar: () => void;
  onEliminado: (id: string, mensaje: string) => void;
  onDesactivado: (id: string, mensaje: string) => void;
}) {
  const [paso, setPaso] = useState<"confirmar" | "tiene-ventas">("confirmar");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function eliminar() {
    setProcesando(true);
    setError(null);
    const { data, error } = await supabase.from("productos").delete().eq("id", producto.id).select("id");
    setProcesando(false);

    if (error) {
      if (error.code === "23503") setPaso("tiene-ventas");
      else setError(mensajeErrorAmigable(error));
      return;
    }
    // Si la seguridad (RLS) bloquea el borrado, Supabase no da error pero devuelve 0 filas
    if (!data || data.length === 0) {
      setError("No tenés permiso para eliminar este producto.");
      return;
    }
    onEliminado(producto.id, `"${producto.nombre}" fue eliminado.`);
  }

  async function desactivar() {
    setProcesando(true);
    setError(null);
    const { error } = await supabase.from("productos").update({ activo: false }).eq("id", producto.id);
    setProcesando(false);
    if (error) {
      setError(mensajeErrorAmigable(error));
      return;
    }
    onDesactivado(producto.id, `"${producto.nombre}" fue desactivado y ya no aparece en la tienda.`);
  }

  if (paso === "confirmar") {
    return (
      <DialogoConfirmar
        titulo="¿Eliminar este producto?"
        textoConfirmar="Eliminar"
        textoProcesando="Eliminando…"
        procesando={procesando}
        error={error}
        onConfirmar={eliminar}
        onCancelar={onCerrar}
      >
        Vas a eliminar <span className="font-medium text-ink">{producto.nombre}</span> ({producto.codigo}) con
        todas sus tallas y fotos. Esta acción no se puede deshacer.
      </DialogoConfirmar>
    );
  }

  return (
    <DialogoConfirmar
      titulo="Este producto tiene ventas registradas"
      tono="normal"
      textoConfirmar={producto.activo ? "Desactivar" : "Ya está desactivado"}
      textoProcesando="Desactivando…"
      deshabilitarConfirmar={!producto.activo}
      procesando={procesando}
      error={error}
      onConfirmar={desactivar}
      onCancelar={onCerrar}
    >
      Si lo eliminamos perderías esas ventas de tu historial y reportes. Te recomendamos desactivarlo: deja de
      aparecer en la tienda pero tus ventas quedan intactas.
    </DialogoConfirmar>
  );
}
