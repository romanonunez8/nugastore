"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const BUCKET = "logos";

export function SubirLogo({
  valor,
  onCambio,
}: {
  valor: string | null;
  onCambio: (url: string) => void;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSeleccionar(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setError(null);
    setSubiendo(true);
    try {
      const extension = archivo.name.split(".").pop();
      const nombreArchivo = `${crypto.randomUUID()}.${extension}`;

      const { error: errorSubida } = await supabase.storage
        .from(BUCKET)
        .upload(nombreArchivo, archivo, { upsert: false });

      if (errorSubida) throw errorSubida;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(nombreArchivo);
      onCambio(data.publicUrl);
    } catch (err) {
      setError("No se pudo subir la imagen. Intenta de nuevo.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div>
      <label className="block text-sm text-inkSoft mb-1">Logo</label>
      <div className="flex items-center gap-3">
        {valor ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={valor} alt="Logo" className="w-14 h-14 rounded-card object-cover border border-line" />
        ) : (
          <div className="w-14 h-14 rounded-card bg-tealSoft flex items-center justify-center text-teal text-xs">
            Sin logo
          </div>
        )}
        <label className="cursor-pointer text-sm font-medium text-teal">
          {subiendo ? "Subiendo…" : valor ? "Cambiar imagen" : "Subir desde el dispositivo"}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onSeleccionar}
            disabled={subiendo}
          />
        </label>
      </div>
      {error && <p className="text-berry text-xs mt-1">{error}</p>}
    </div>
  );
}
