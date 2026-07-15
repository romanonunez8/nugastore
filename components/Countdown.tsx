"use client";

import { useEffect, useState } from "react";

function partesRestantes(termina: string) {
  const diff = new Date(termina).getTime() - Date.now();
  if (diff <= 0) return null;
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutos = Math.floor((diff / (1000 * 60)) % 60);
  const segundos = Math.floor((diff / 1000) % 60);
  return { dias, horas, minutos, segundos };
}

export default function Countdown({ termina }: { termina: string }) {
  const [restante, setRestante] = useState(() => partesRestantes(termina));

  useEffect(() => {
    const id = setInterval(() => setRestante(partesRestantes(termina)), 1000);
    return () => clearInterval(id);
  }, [termina]);

  if (!restante) return null;

  const { dias, horas, minutos, segundos } = restante;
  const texto =
    dias > 0
      ? `${dias}d ${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`
      : `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;

  return (
    <span className="font-body text-[11px] font-semibold tracking-wide tabular-nums">
      Termina en {texto}
    </span>
  );
}
