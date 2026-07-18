"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { generarSlug } from "@/lib/supabase";
import { SubirLogo } from "./SubirLogo";

export function NuevaTiendaForm({ onCreada }: { onCreada: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [plan, setPlan] = useState("emprende");
  const [fechaInicio, setFechaInicio] = useState(() => new Date().toISOString().slice(0, 10));
  const [fechaFin, setFechaFin] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function limpiar() {
    setNombre("");
    setWhatsapp("");
    setPlan("emprende");
    setFechaFin("");
    setLogoUrl(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);

    try {
      const { error: errorInsert } = await supabase.from("tiendas").insert({
        nombre,
        whatsapp,
        slug: generarSlug(nombre),
        moneda: "BOB",
        plan,
        logo_url: logoUrl,
        fecha_inicio_suscripcion: fechaInicio,
        fecha_fin_suscripcion: fechaFin || null,
        suscripcion_activa: true,
      });

      if (errorInsert) throw errorInsert;

      limpiar();
      setAbierto(false);
      onCreada();
    } catch (err) {
      setError("No se pudo crear la tienda. Revisa los datos e intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="rounded-card bg-teal text-white font-medium px-5 py-3 shadow-card"
      >
        + Nueva tienda
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-card border border-line bg-white p-5 space-y-4 shadow-card"
    >
      <h3 className="font-display text-xl text-ink">Nueva tienda</h3>

      <div>
        <label className="block text-sm text-inkSoft mb-1">Nombre de la tienda</label>
        <input
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
          placeholder="Ej: Boutique Sofía"
        />
      </div>

      <div>
        <label className="block text-sm text-inkSoft mb-1">WhatsApp (con código de país, sin +)</label>
        <input
          required
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
          placeholder="59171234567"
        />
      </div>

      <SubirLogo valor={logoUrl} onCambio={setLogoUrl} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-inkSoft mb-1">Plan</label>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
          >
            <option value="emprende">Emprende</option>
            <option value="crece">Crece</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-inkSoft mb-1">Vence el</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
          />
        </div>
      </div>

      {error && <p className="text-berry text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={guardando}
          className="rounded-card bg-teal text-white font-medium px-5 py-2.5 shadow-card disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Crear tienda"}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="text-inkSoft text-sm font-medium"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
