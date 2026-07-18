"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { actualizarPassword, cerrarSesion } from "@/lib/auth";

export default function ActualizarPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [enlaceValido, setEnlaceValido] = useState(false);

  useEffect(() => {
    // Da tiempo a que el cliente de Supabase procese el token de la URL (hash o ?code=)
    const verificar = async () => {
      const { data } = await supabase.auth.getSession();
      setEnlaceValido(!!data.session);
      setVerificando(false);
    };
    const t = setTimeout(verificar, 500);
    return () => clearTimeout(t);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setGuardando(true);
    try {
      await actualizarPassword(password);
      setListo(true);
      await cerrarSesion();
      setTimeout(() => router.replace("/admin/login"), 2000);
    } catch (err) {
      const detalle = err instanceof Error ? err.message : "Error desconocido";
      setError(`No se pudo actualizar la contraseña: ${detalle}`);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-ink mb-1">Nueva contraseña</h1>

        {verificando ? (
          <p className="text-inkSoft text-sm mt-6">Verificando enlace…</p>
        ) : listo ? (
          <div className="mt-6 rounded-card bg-tealSoft text-teal text-sm px-4 py-3">
            Listo, tu contraseña se actualizó. Te llevamos al login…
          </div>
        ) : !enlaceValido ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-card bg-berrySoft text-berry text-sm px-4 py-3">
              Este enlace ya no es válido — puede haber expirado o ya haber sido usado. Los
              enlaces de recuperación duran poco tiempo y sirven una sola vez.
            </div>
            <a href="/admin/login/recuperar" className="block text-center text-sm text-teal font-medium">
              Solicitar un enlace nuevo
            </a>
          </div>
        ) : (
          <>
            <p className="text-inkSoft text-sm mb-8">Escribí tu contraseña nueva dos veces.</p>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-inkSoft mb-1">Contraseña nueva</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-card border border-line bg-white px-4 py-3 text-ink outline-none focus:border-teal"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div>
                <label className="block text-sm text-inkSoft mb-1">Repetir contraseña</label>
                <input
                  type="password"
                  required
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  className="w-full rounded-card border border-line bg-white px-4 py-3 text-ink outline-none focus:border-teal"
                />
              </div>

              {error && <p className="text-berry text-sm">{error}</p>}

              <button
                type="submit"
                disabled={guardando}
                className="w-full rounded-card bg-teal text-white font-medium py-3 shadow-card disabled:opacity-60"
              >
                {guardando ? "Guardando…" : "Guardar contraseña nueva"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
