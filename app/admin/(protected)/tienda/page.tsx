"use client";

import { useEffect, useState } from "react";
import { supabase, tiendaVisible, type Tienda } from "@/lib/supabase";
import { useAdminAuth } from "@/lib/admin-auth-context";

export default function MiTiendaPage() {
  const { sesion } = useAdminAuth();
  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!sesion?.tiendaId) return;
    supabase
      .from("tiendas")
      .select("*")
      .eq("id", sesion.tiendaId)
      .single()
      .then(({ data }) => {
        setTienda(data);
        setCargando(false);
      });
  }, [sesion]);

  if (cargando) return <p className="text-inkSoft">Cargando…</p>;
  if (!tienda) return <p className="text-berry">No se encontró tu tienda.</p>;

  const visible = tiendaVisible(tienda);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {tienda.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tienda.logo_url}
            alt={tienda.nombre}
            className="w-16 h-16 rounded-card object-cover border border-line"
          />
        ) : (
          <div className="w-16 h-16 rounded-card bg-tealSoft" />
        )}
        <div>
          <h1 className="font-display text-2xl text-ink">{tienda.nombre}</h1>
          <p className="text-sm text-inkSoft">Plan {tienda.plan}</p>
        </div>
      </div>

      <div className="rounded-card border border-line bg-white p-5">
        <h2 className="font-medium text-ink mb-2">Estado de tu suscripción</h2>
        <p className="text-sm text-inkSoft">
          Estado actual:{" "}
          <span className={visible ? "text-teal font-medium" : "text-berry font-medium"}>
            {visible ? "Activa y visible en el catálogo" : "Oculta"}
          </span>
        </p>
        <p className="text-sm text-inkSoft">
          Vence el:{" "}
          {tienda.fecha_fin_suscripcion
            ? new Date(tienda.fecha_fin_suscripcion).toLocaleDateString("es-BO")
            : "sin fecha definida"}
        </p>
        <p className="text-xs text-inkSoft mt-2">
          Para renovar o cambiar de plan, contacta al administrador de la plataforma.
        </p>
      </div>

      <div className="rounded-card border border-dashed border-line bg-white p-5 text-inkSoft text-sm">
        Próximamente acá vas a poder cargar tus productos con fotos, crear ofertas y ver tus
        reportes de ventas.
      </div>
    </div>
  );
}
