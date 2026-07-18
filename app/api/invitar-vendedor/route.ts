import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { crearClienteAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { email, tiendaId } = await req.json();

    if (!email || !tiendaId) {
      return NextResponse.json({ error: "Faltan datos (correo o tienda)." }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "");

    // Cliente normal (clave pública) solo para confirmar quién está llamando
    const clienteVerificador = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: datosUsuario, error: errorUsuario } = await clienteVerificador.auth.getUser(token);
    if (errorUsuario || !datosUsuario.user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const admin = crearClienteAdmin();

    // Confirma que quien llama sea realmente admin_tienda de ESA tienda (no de otra)
    const { data: filaRol } = await admin
      .from("usuarios_tienda")
      .select("rol")
      .eq("user_id", datosUsuario.user.id)
      .eq("tienda_id", tiendaId)
      .maybeSingle();

    if (!filaRol || filaRol.rol !== "admin_tienda") {
      return NextResponse.json(
        { error: "No tenés permiso para invitar usuarios en esta tienda." },
        { status: 403 }
      );
    }

    // Envía la invitación por correo (Supabase genera el enlace y lo manda)
    const origen = req.headers.get("origin") ?? "";
    const { data: invitado, error: errorInvite } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origen}/admin/actualizar-password`,
    });

    if (errorInvite || !invitado?.user) {
      return NextResponse.json(
        { error: errorInvite?.message ?? "No se pudo enviar la invitación." },
        { status: 400 }
      );
    }

    // Asigna el rol de vendedor para esta tienda específica
    const { error: errorRol } = await admin.from("usuarios_tienda").insert({
      user_id: invitado.user.id,
      tienda_id: tiendaId,
      rol: "editor",
      email,
    });

    if (errorRol) {
      return NextResponse.json({ error: errorRol.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
