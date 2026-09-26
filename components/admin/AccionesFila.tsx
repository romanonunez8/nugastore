"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────
// Piezas compartidas para las acciones de cada fila del panel:
// íconos de editar/eliminar, cuadro de confirmación y aviso flotante.
// Se usan en Productos, Inventario, Categorías y Ofertas.
// ─────────────────────────────────────────────────────────────

export function IconoEditar({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 20h4L18.5 9.5a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  );
}

export function IconoEliminar({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" />
      <path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" />
    </svg>
  );
}

/** Botones de editar (link o acción) y eliminar, alineados a la derecha. */
export function AccionesFila({
  nombre,
  hrefEditar,
  onEditar,
  onEliminar,
}: {
  nombre: string;
  hrefEditar?: string;
  onEditar?: () => void;
  onEliminar?: () => void;
}) {
  const claseEditar = "rounded-full p-2 text-teal transition-colors hover:bg-tealSoft";
  return (
    <div className="flex shrink-0 items-center justify-end gap-1">
      {hrefEditar ? (
        <Link href={hrefEditar} title="Editar" aria-label={`Editar ${nombre}`} className={claseEditar}>
          <IconoEditar />
        </Link>
      ) : onEditar ? (
        <button type="button" onClick={onEditar} title="Editar" aria-label={`Editar ${nombre}`} className={claseEditar}>
          <IconoEditar />
        </button>
      ) : null}
      {onEliminar && (
        <button
          type="button"
          onClick={onEliminar}
          title="Eliminar"
          aria-label={`Eliminar ${nombre}`}
          className="rounded-full p-2 text-berry transition-colors hover:bg-berrySoft"
        >
          <IconoEliminar />
        </button>
      )}
    </div>
  );
}

/** Cuadro de confirmación reutilizable. `tono="peligro"` pinta el botón en rojo. */
export function DialogoConfirmar({
  titulo,
  children,
  textoConfirmar,
  textoProcesando,
  tono = "peligro",
  procesando = false,
  deshabilitarConfirmar = false,
  error,
  onConfirmar,
  onCancelar,
}: {
  titulo: string;
  children: React.ReactNode;
  textoConfirmar: string;
  textoProcesando: string;
  tono?: "peligro" | "normal";
  procesando?: boolean;
  deshabilitarConfirmar?: boolean;
  error?: string | null;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  // Cerrar con Escape
  const cancelarRef = useRef(onCancelar);
  cancelarRef.current = onCancelar;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !procesando && cancelarRef.current();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [procesando]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-label={titulo}>
      <button aria-label="Cerrar" onClick={() => !procesando && onCancelar()} className="absolute inset-0 bg-ink/40" />
      <div className="relative w-full max-w-sm rounded-card bg-white p-5 shadow-card">
        {tono === "peligro" && (
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-berrySoft text-berry">
            <IconoEliminar />
          </div>
        )}
        <h2 className="text-base font-semibold text-ink">{titulo}</h2>
        <div className="mt-1 text-sm text-inkSoft">{children}</div>

        {error && <p className="mt-3 rounded-xl bg-berrySoft px-3 py-2 text-sm text-berry">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancelar}
            disabled={procesando}
            className="rounded-card border border-line px-4 py-2 text-sm font-medium text-ink disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={procesando || deshabilitarConfirmar}
            className={`rounded-card px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
              tono === "peligro" ? "bg-berry" : "bg-teal"
            }`}
          >
            {procesando ? textoProcesando : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Aviso corto que aparece abajo y se oculta solo a los 4 segundos. */
export function AvisoFlotante({ texto, onCerrar }: { texto: string | null; onCerrar: () => void }) {
  // Guardamos onCerrar en una ref para que el temporizador no se reinicie en cada render
  const cerrarRef = useRef(onCerrar);
  cerrarRef.current = onCerrar;

  useEffect(() => {
    if (!texto) return;
    const t = setTimeout(() => cerrarRef.current(), 4000);
    return () => clearTimeout(t);
  }, [texto]);

  if (!texto) return null;
  return (
    <div
      role="status"
      className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-white shadow-card md:bottom-8"
    >
      {texto}
    </div>
  );
}
