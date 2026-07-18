"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { iniciarSesion } from "@/lib/auth";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const sinRol = params.get("sin-rol") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await iniciarSesion(email, password);
      router.replace("/admin");
    } catch (err) {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-ink mb-1">Panel Nugastore</h1>
        <p className="text-inkSoft text-sm mb-8">Ingresa con tu correo y contraseña.</p>

        {sinRol && (
          <div className="mb-6 rounded-card bg-berrySoft text-berry text-sm px-4 py-3">
            Tu cuenta no tiene un rol asignado todavía. Contacta al administrador.
          </div>
        )}

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

          <div>
            <label className="block text-sm text-inkSoft mb-1" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-card border border-line bg-white px-4 py-3 text-ink outline-none focus:border-teal"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-berry text-sm">{error}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-card bg-teal text-white font-medium py-3 shadow-card disabled:opacity-60"
          >
            {enviando ? "Ingresando…" : "Ingresar"}
          </button>

          <a href="/admin/login/recuperar" className="block text-center text-sm text-teal font-medium">
            ¿Olvidaste tu contraseña?
          </a>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
