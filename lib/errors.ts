/** Extrae un mensaje legible de cualquier error, sea una instancia de Error
 * de JavaScript o un objeto de error de Supabase/Postgrest (que no siempre
 * es una instancia real de Error pero tiene una propiedad "message"). */
export function mensajeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Error desconocido";
}

/**
 * Diccionario de códigos de error de Postgres/Supabase → mensaje amigable en
 * español. Para agregar uno nuevo, sumá una línea con el código y el texto
 * que quieras que vea el usuario. Códigos comunes:
 * https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export const MENSAJES_ERROR_AMIGABLES: Record<string, string> = {
  "23502": "Falta completar un campo obligatorio.",
  "23505": "Ya existe un registro con ese mismo valor (por ejemplo, un código repetido).",
  "23503": "Ese registro está relacionado con otro que ya no existe o fue eliminado.",
  "42501": "No tenés permiso para realizar esta acción.",
  PGRST116: "No se encontró el registro solicitado.",
};

/**
 * Mensaje de error pensado para mostrarle a la persona que usa el panel
 * (nunca el texto técnico crudo de la base de datos, salvo en desarrollo,
 * donde ayuda a diagnosticar más rápido).
 */
export function mensajeErrorAmigable(err: unknown): string {
  // Siempre queda registrado en la consola del navegador para diagnosticar,
  // aunque a la persona no se le muestre el detalle técnico.
  // eslint-disable-next-line no-console
  console.error(err);

  const codigo = (err as { code?: string } | null)?.code;
  const crudo = mensajeError(err);

  // Las excepciones que nosotros mismos lanzamos desde funciones SQL (RAISE
  // EXCEPTION, código P0001 — por ejemplo "Stock insuficiente: quedan X
  // unidades") ya están redactadas para mostrarse tal cual a la persona.
  if (codigo === "P0001") return crudo;

  if (codigo && MENSAJES_ERROR_AMIGABLES[codigo]) {
    return MENSAJES_ERROR_AMIGABLES[codigo];
  }

  if (process.env.NODE_ENV !== "production") {
    return crudo;
  }

  return "Ocurrió un problema al procesar esto. Si el error persiste, contactanos.";
}
