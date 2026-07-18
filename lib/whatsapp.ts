import type { Producto, Variante } from "./supabase";
import { fotoPortada } from "./supabase";

/** Plantilla por defecto si la tienda todavía no personalizó la suya.
 * Si una línea usa un placeholder y ese dato no aplica (ej. sin talla),
 * esa línea se omite sola del mensaje final — no hace falta lógica aparte. */
export const PLANTILLA_WHATSAPP_PREDETERMINADA = `Hola! Quiero este producto:
Codigo: {codigo}
Nombre: {nombre}
Talla: {talla}
Color: {color}
Precio: Bs {precio}
Foto: {foto}`;

function renderizarPlantilla(plantilla: string, valores: Record<string, string>) {
  return plantilla
    .split("\n")
    .map((linea) => {
      let faltaAlgo = false;
      const resultado = linea.replace(/\{(\w+)\}/g, (_coincidencia, clave: string) => {
        const valor = valores[clave];
        if (!valor) {
          faltaAlgo = true;
          return "";
        }
        return valor;
      });
      // Si la línea dependía de un dato que no está disponible, se omite entera.
      return faltaAlgo ? null : resultado;
    })
    .filter((linea): linea is string => linea !== null)
    .join("\n");
}

/**
 * Construye el enlace https://wa.me/... con el mensaje precargado.
 * Usa la plantilla propia de la tienda si la tiene configurada, o la
 * predeterminada si no. La foto es siempre la portada del carrusel.
 */
export function enlaceWhatsApp(params: {
  numero: string; // ej: "59171234567"
  producto: Producto;
  variante?: Variante | null;
  precioFinal: number;
  plantilla?: string | null;
}) {
  const { numero, producto, variante, precioFinal, plantilla } = params;

  const valores: Record<string, string> = {
    codigo: producto.codigo,
    nombre: producto.nombre,
    talla: variante?.talla ?? "",
    color: variante?.color ?? "",
    precio: precioFinal.toFixed(2),
    foto: fotoPortada(producto) ?? "",
  };

  const texto = encodeURIComponent(
    renderizarPlantilla(plantilla?.trim() || PLANTILLA_WHATSAPP_PREDETERMINADA, valores)
  );
  return `https://wa.me/${numero}?text=${texto}`;
}
