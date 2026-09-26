"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth-context";
import { cerrarSesion } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import NavegacionAdmin, { type Rol } from "@/components/admin/NavegacionAdmin";

function Contenido({ children }: { children: React.ReactNode }) {
  const { cargando, sesion } = useAdminAuth();
  const router = useRouter();
  const [nombreTienda, setNombreTienda] = useState<string | null>(null);
  const [logoTienda, setLogoTienda] = useState<string | null>(null);

  useEffect(() => {
    if (!sesion?.tiendaId) {
      setNombreTienda(null);
      setLogoTienda(null);
      return;
    }
    supabase
      .from("tiendas")
      .select("nombre, logo_url")
      .eq("id", sesion.tiendaId)
      .single()
      .then(({ data }) => {
        setNombreTienda(data?.nombre ?? null);
        setLogoTienda(data?.logo_url ?? null);
      });
  }, [sesion?.tiendaId]);

  async function salir() {
    await cerrarSesion();
    router.replace("/admin/login");
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center text-inkSoft">
        Cargando…
      </div>
    );
  }

  if (!sesion) {
    // El provider ya redirige a /admin/login; esto evita un parpadeo de contenido protegido.
    return null;
  }

  return (
    <div className="min-h-screen bg-paper">
      <NavegacionAdmin
        rol={sesion.rol as Rol}
        nombreTienda={sesion.rol === "superadmin" ? null : nombreTienda}
        logoTienda={sesion.rol === "superadmin" ? null : logoTienda}
        onSalir={salir}
      />
      {/* md:pl-60 deja espacio a la barra lateral; pb-28 deja espacio a la barra inferior del celular */}
      <div className="md:pl-60">
        <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 md:px-8 md:pb-10 md:pt-8">{children}</main>
      </div>
    </div>
  );
}

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <Contenido>{children}</Contenido>
    </AdminAuthProvider>
  );
}
