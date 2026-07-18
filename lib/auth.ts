import { supabase } from "./supabase";
import type { Rol } from "./supabase";

export type SesionRol = {
  rol: Rol;
  tiendaId: string | null; // null = superadmin (ve todas las tiendas)
};

export async function iniciarSesion(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function cerrarSesion() {
  await supabase.auth.signOut();
}

/**
 * Resuelve el rol del usuario logueado consultando usuarios_tienda.
 * Si tiene una fila con tienda_id = null, es superadmin (esa fila tiene prioridad).
 * Devuelve null si no hay sesión o el usuario no tiene ningún rol asignado.
 */
export async function obtenerRolActual(): Promise<SesionRol | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("usuarios_tienda")
    .select("rol, tienda_id")
    .eq("user_id", user.id);

  if (error || !data || data.length === 0) return null;

  const superadmin = data.find((r) => r.tienda_id === null);
  if (superadmin) return { rol: "superadmin", tiendaId: null };

  const primero = data[0];
  return { rol: primero.rol as Rol, tiendaId: primero.tienda_id };
}
