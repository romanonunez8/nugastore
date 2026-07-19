"use client";

import { useEffect, useState } from "react";

/**
 * Input numérico que resuelve el problema de "no puedo borrar el 0":
 * al enfocarlo, si el valor es 0 lo deja vacío y selecciona todo el
 * texto para escribir encima. Si lo dejás vacío y salís del campo,
 * vuelve a 0 (nunca queda un valor inválido).
 */
export function CampoNumero({
  valor,
  onCambio,
  min,
  max,
  step = "1",
  placeholder,
  required,
  className,
  disabled,
}: {
  valor: number;
  onCambio: (valor: number) => void;
  min?: number;
  max?: number;
  step?: number | string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}) {
  const [texto, setTexto] = useState(String(valor));

  // Si el valor cambia desde afuera (ej. se terminó de cargar el producto), sincroniza.
  useEffect(() => {
    setTexto(String(valor));
  }, [valor]);

  return (
    <input
      type="number"
      inputMode="decimal"
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      value={texto}
      onFocus={(e) => {
        if (texto === "0") setTexto("");
        e.target.select();
      }}
      onChange={(e) => {
        setTexto(e.target.value);
        const num = parseFloat(e.target.value);
        onCambio(isNaN(num) ? 0 : num);
      }}
      onBlur={() => {
        if (texto.trim() === "") {
          setTexto("0");
          onCambio(0);
        }
      }}
      className={className}
    />
  );
}
