"use client";

import { useState } from "react";
import Link from "next/link";
import { solicitarRecuperacion } from "@/lib/auth";
import { mensajeErrorAmigable } from "@/lib/errors";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await solicitarRecuperacion(email);
      setEnviado(true);
    } catch (err) {
      const detalle = mensajeErrorAmigable(err);
      setError(`No se pudo enviar el correo: ${detalle}`);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-ink mb-1">Recuperar contraseña</h1>

        {enviado ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-card bg-tealSoft text-teal text-sm px-4 py-3">
              Si el correo <strong>{email}</strong> tiene una cuenta, te llegó un enlace para
              definir una contraseña nueva. Revisá también la carpeta de spam.
            </div>
            <Link href="/admin/login" className="block text-center text-sm text-teal font-medium">
              Volver al login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-inkSoft text-sm mb-8">
              Escribí tu correo y te mandamos un enlace para definir una contraseña nueva.
            </p>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-inkSoft mb-1" htmlFor="email">
                  Correo
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-card border border-line bg-white px-4 py-3 text-ink outline-none focus:border-teal"
                  placeholder="tucorreo@ejemplo.com"
                />
              </div>

              {error && <p className="text-berry text-sm">{error}</p>}

              <button
                type="submit"
                disabled={enviando}
                className="w-full rounded-card bg-teal text-white font-medium py-3 shadow-card disabled:opacity-60"
              >
                {enviando ? "Enviando…" : "Enviar enlace"}
              </button>

              <Link href="/admin/login" className="block text-center text-sm text-inkSoft">
                Volver al login
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
