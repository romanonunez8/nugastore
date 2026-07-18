import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con la clave "service_role". Tiene permisos totales y se salta
 * las políticas de seguridad (RLS). SOLO se debe usar dentro de Route
 * Handlers (código de servidor) — nunca importar esto desde un archivo
 * marcado con "use client".
 *
 * Requiere la variable de entorno SUPABASE_SERVICE_ROLE_KEY (SIN el
 * prefijo NEXT_PUBLIC_, para que no se incluya en el código del navegador).
 * La clave está en Supabase → Project Settings → API → service_role.
 */
export function crearClienteAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceKey) {
    throw new Error(
      "Falta la variable de entorno SUPABASE_SERVICE_ROLE_KEY en el servidor."
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
