"use client";

import { useState } from "react";
import { actualizarPassword } from "@/lib/auth";

export default function CuentaPage() {
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMensaje(null);

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
      setMensaje("Contraseña actualizada correctamente.");
      setPassword("");
      setConfirmar("");
    } catch (err) {
      setError("No se pudo actualizar la contraseña. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="max-w-sm space-y-6">
      <h1 className="font-display text-2xl text-ink">Mi cuenta</h1>

      <form onSubmit={onSubmit} className="space-y-4 rounded-card border border-line bg-white p-5">
        <h2 className="font-medium text-ink">Cambiar contraseña</h2>

        <div>
          <label className="block text-sm text-inkSoft mb-1">Contraseña nueva</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
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
            className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
          />
        </div>

        {error && <p className="text-berry text-sm">{error}</p>}
        {mensaje && <p className="text-teal text-sm">{mensaje}</p>}

        <button
          type="submit"
          disabled={guardando}
          className="rounded-card bg-teal text-white font-medium px-5 py-2.5 shadow-card disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar contraseña nueva"}
        </button>
      </form>
    </div>
  );
}
