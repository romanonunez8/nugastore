"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./supabase";
import { obtenerRolActual, type SesionRol } from "./auth";

type EstadoAuth = {
  cargando: boolean;
  sesion: SesionRol | null;
  refrescar: () => Promise<void>;
};

const AdminAuthContext = createContext<EstadoAuth>({
  cargando: true,
  sesion: null,
  refrescar: async () => {},
});

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [cargando, setCargando] = useState(true);
  const [sesion, setSesion] = useState<SesionRol | null>(null);
  const router = useRouter();

  async function cargar(mostrarCargando = true) {
    if (mostrarCargando) setCargando(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSesion(null);
      setCargando(false);
      router.replace("/admin/login");
      return;
    }

    const rol = await obtenerRolActual();
    setSesion(rol);
    setCargando(false);

    if (!rol) {
      // Usuario autenticado pero sin rol asignado en usuarios_tienda
      router.replace("/admin/login?sin-rol=1");
    }
  }

  useEffect(() => {
    cargar();
    // Revisiones posteriores (ej. al volver a la pestaña, Supabase refresca el token
    // automáticamente) no deben mostrar la pantalla de carga ni desmontar la página,
    // porque eso borraría cualquier formulario que la persona esté completando.
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      cargar(false);
    });
    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdminAuthContext.Provider value={{ cargando, sesion, refrescar: cargar }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
