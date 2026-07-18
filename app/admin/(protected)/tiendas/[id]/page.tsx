"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase, type Tienda } from "@/lib/supabase";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { mensajeErrorAmigable } from "@/lib/errors";
import { SubirLogo } from "@/components/admin/SubirLogo";

export default function EditarTiendaPage() {
  const { id } = useParams<{ id: string }>();
  const { sesion } = useAdminAuth();
  const router = useRouter();

  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("tiendas")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setTienda(data);
        setCargando(false);
      });
  }, [id]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!tienda) return;
    setError(null);
    setMensaje(null);
    setGuardando(true);

    try {
      const { error: errorUpdate } = await supabase
        .from("tiendas")
        .update({
          nombre: tienda.nombre,
          whatsapp: tienda.whatsapp,
          logo_url: tienda.logo_url,
          plan: tienda.plan,
          fecha_inicio_suscripcion: tienda.fecha_inicio_suscripcion,
          fecha_fin_suscripcion: tienda.fecha_fin_suscripcion || null,
        })
        .eq("id", tienda.id);

      if (errorUpdate) throw errorUpdate;
      setMensaje("Guardado correctamente.");
    } catch (err) {
      setError(mensajeErrorAmigable(err));
    } finally {
      setGuardando(false);
    }
  }

  if (sesion && sesion.rol !== "superadmin") {
    return <p className="text-berry">No tienes permiso para ver esta sección.</p>;
  }
  if (cargando) return <p className="text-inkSoft">Cargando…</p>;
  if (!tienda) return <p className="text-berry">Tienda no encontrada.</p>;

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Editar tienda</h1>
        <button onClick={() => router.push("/admin/tiendas")} className="text-sm text-inkSoft">
          ← Volver
        </button>
      </div>

      <form onSubmit={guardar} className="space-y-4 rounded-card border border-line bg-white p-5">
        <SubirLogo
          valor={tienda.logo_url}
          onCambio={(url) => setTienda({ ...tienda, logo_url: url })}
        />

        <div>
          <label className="block text-sm text-inkSoft mb-1">Nombre de la tienda</label>
          <input
            required
            value={tienda.nombre}
            onChange={(e) => setTienda({ ...tienda, nombre: e.target.value })}
            className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
          />
        </div>

        <div>
          <label className="block text-sm text-inkSoft mb-1">WhatsApp</label>
          <input
            required
            value={tienda.whatsapp}
            onChange={(e) => setTienda({ ...tienda, whatsapp: e.target.value })}
            className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-inkSoft mb-1">Plan</label>
            <select
              value={tienda.plan}
              onChange={(e) => setTienda({ ...tienda, plan: e.target.value })}
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
              value={tienda.fecha_fin_suscripcion ?? ""}
              onChange={(e) => setTienda({ ...tienda, fecha_fin_suscripcion: e.target.value })}
              className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
            />
          </div>
        </div>

        {error && <p className="text-berry text-sm">{error}</p>}
        {mensaje && <p className="text-teal text-sm">{mensaje}</p>}

        <button
          type="submit"
          disabled={guardando}
          className="rounded-card bg-teal text-white font-medium px-5 py-2.5 shadow-card disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
