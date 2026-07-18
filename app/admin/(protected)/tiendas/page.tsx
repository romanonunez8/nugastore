"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase, tiendaVisible, type Tienda } from "@/lib/supabase";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { NuevaTiendaForm } from "@/components/admin/NuevaTiendaForm";

function EstadoBadge({ tienda }: { tienda: Tienda }) {
  const visible = tiendaVisible(tienda);
  const forzado = tienda.visible_forzado !== null;

  return (
    <span
      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
        visible ? "bg-tealSoft text-teal" : "bg-berrySoft text-berry"
      }`}
    >
      {visible ? "Visible" : "Oculta"}
      {forzado ? " (manual)" : ""}
    </span>
  );
}

function TiendaRow({ tienda, onCambio }: { tienda: Tienda; onCambio: () => void }) {
  const [actualizando, setActualizando] = useState(false);

  const vencida =
    tienda.fecha_fin_suscripcion !== null &&
    new Date(tienda.fecha_fin_suscripcion) < new Date();

  async function forzarVisibilidad(valor: boolean | null) {
    setActualizando(true);
    await supabase.from("tiendas").update({ visible_forzado: valor }).eq("id", tienda.id);
    setActualizando(false);
    onCambio();
  }

  return (
    <div className="flex items-center justify-between rounded-card border border-line bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        {tienda.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tienda.logo_url}
            alt={tienda.nombre}
            className="w-11 h-11 rounded-card object-cover border border-line"
          />
        ) : (
          <div className="w-11 h-11 rounded-card bg-tealSoft" />
        )}
        <div>
          <p className="font-medium text-ink">{tienda.nombre}</p>
          <p className="text-xs text-inkSoft">
            Plan {tienda.plan} · Vence{" "}
            {tienda.fecha_fin_suscripcion
              ? new Date(tienda.fecha_fin_suscripcion).toLocaleDateString("es-BO")
              : "sin fecha"}
            {vencida && <span className="text-berry"> (vencida)</span>}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <EstadoBadge tienda={tienda} />
        <select
          disabled={actualizando}
          value={tienda.visible_forzado === null ? "auto" : tienda.visible_forzado ? "on" : "off"}
          onChange={(e) => {
            const v = e.target.value;
            forzarVisibilidad(v === "auto" ? null : v === "on");
          }}
          className="text-xs rounded-card border border-line px-2 py-1.5 outline-none"
        >
          <option value="auto">Automático (según suscripción)</option>
          <option value="on">Forzar visible</option>
          <option value="off">Forzar oculta</option>
        </select>
        <Link href={`/admin/tiendas/${tienda.id}`} className="text-sm font-medium text-teal">
          Editar
        </Link>
      </div>
    </div>
  );
}

export default function TiendasPage() {
  const { sesion } = useAdminAuth();
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await supabase.from("tiendas").select("*").order("nombre");
    setTiendas(data ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (sesion && sesion.rol !== "superadmin") {
    return <p className="text-berry">No tienes permiso para ver esta sección.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Tiendas</h1>
        <NuevaTiendaForm onCreada={cargar} />
      </div>

      {cargando ? (
        <p className="text-inkSoft">Cargando…</p>
      ) : tiendas.length === 0 ? (
        <p className="text-inkSoft">Todavía no hay tiendas creadas.</p>
      ) : (
        <div className="space-y-3">
          {tiendas.map((t) => (
            <TiendaRow key={t.id} tienda={t} onCambio={cargar} />
          ))}
        </div>
      )}
    </div>
  );
}
