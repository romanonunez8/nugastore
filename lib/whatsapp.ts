import type { Producto, Variante } from "./supabase";

/**
 * Construye el enlace https://wa.me/... con el mensaje precargado,
 * según el formato descrito en la sección 3.4 de la guía.
 */
export function enlaceWhatsApp(params: {
  numero: string; // ej: "59171234567"
  producto: Producto;
  variante?: Variante | null;
  precioFinal: number;
}) {
  const { numero, producto, variante, precioFinal } = params;

  const lineas = [
    `Hola! Quiero este producto:`,
    `Codigo: ${producto.codigo}`,
    `Nombre: ${producto.nombre}`,
  ];

  if (variante?.talla) lineas.push(`Talla: ${variante.talla}`);
  if (variante?.color) lineas.push(`Color: ${variante.color}`);

  lineas.push(`Precio: Bs ${precioFinal.toFixed(2)}`);

  if (producto.foto_url) lineas.push(`Foto: ${producto.foto_url}`);

  const texto = encodeURIComponent(lineas.join("\n"));
  return `https://wa.me/${numero}?text=${texto}`;
}
