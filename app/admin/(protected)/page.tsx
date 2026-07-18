"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/admin-auth-context";

export default function AdminHome() {
  const { cargando, sesion } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (cargando || !sesion) return;
    if (sesion.rol === "superadmin") {
      router.replace("/admin/tiendas");
    } else {
      router.replace("/admin/tienda");
    }
  }, [cargando, sesion, router]);

  return null;
}
