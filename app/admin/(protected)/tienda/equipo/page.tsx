"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, type UsuarioTienda } from "@/lib/supabase";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { mensajeErrorAmigable } from "@/lib/errors";

export default function EquipoPage() {
  const { sesion } = useAdminAuth();
  const [equipo, setEquipo] = useState<UsuarioTienda[]>([]);
  const [cargando, setCargando] = useState(true);
  const [email, setEmail] = useState("");
  const [invitando, setInvitando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!sesion?.tiendaId) return;
    setCargando(true);
    const { data } = await supabase
      .from("usuarios_tienda")
      .select("*")
      .eq("tienda_id", sesion.tiendaId)
      .eq("rol", "editor");
    setEquipo(data ?? []);
    setCargando(false);
  }, [sesion]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function invitar(e: React.FormEvent) {
    e.preventDefault();
    if (!sesion?.tiendaId) return;
    setError(null);
    setMensaje(null);
    setInvitando(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Sesión no encontrada");

      const res = await fetch("/api/invitar-vendedor", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, tiendaId: sesion.tiendaId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo invitar.");
      }

      setMensaje(`Invitación enviada a ${email}.`);
      setEmail("");
      cargar();
    } catch (err) {
      const detalle = mensajeErrorAmigable(err);
      setError(detalle);
    } finally {
      setInvitando(false);
    }
  }

  async function quitarAcceso(fila: UsuarioTienda) {
    if (!confirm(`¿Quitar el acceso de ${fila.email ?? "este usuario"}?`)) return;
    await supabase.from("usuarios_tienda").delete().eq("id", fila.id);
    cargar();
  }

  if (sesion && sesion.rol !== "admin_tienda") {
    return <p className="text-berry">Esta sección es solo para el administrador de la tienda.</p>;
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-display text-2xl text-ink">Mi equipo</h1>
      <p className="text-inkSoft text-sm -mt-4">
        Invitá vendedores para que puedan registrar ventas sin poder editar productos, precios ni
        ofertas.
      </p>

      <form onSubmit={invitar} className="flex gap-2 rounded-card border border-line bg-white p-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@ejemplo.com"
          className="flex-1 rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
        />
        <button
          type="submit"
          disabled={invitando}
          className="rounded-card bg-teal text-white font-medium px-5 py-2.5 shadow-card disabled:opacity-60"
        >
          {invitando ? "Enviando…" : "Invitar vendedor"}
        </button>
      </form>

      {error && <p className="text-berry text-sm">{error}</p>}
      {mensaje && <p className="text-teal text-sm">{mensaje}</p>}

      {cargando ? (
        <p className="text-inkSoft">Cargando…</p>
      ) : equipo.length === 0 ? (
        <p className="text-inkSoft text-sm">Todavía no invitaste a nadie.</p>
      ) : (
        <div className="space-y-2">
          {equipo.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between rounded-card border border-line bg-white px-4 py-3"
            >
              <span className="text-sm text-ink">{u.email}</span>
              <button onClick={() => quitarAcceso(u)} className="text-xs text-berry font-medium">
                Quitar acceso
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
