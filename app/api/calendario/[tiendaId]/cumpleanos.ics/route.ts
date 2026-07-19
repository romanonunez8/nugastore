import { NextRequest, NextResponse } from "next/server";
import { crearClienteAdmin } from "@/lib/supabase-admin";

/**
 * Feed de calendario (.ics) con los cumpleaños de los clientes de una
 * tienda, como eventos anuales recurrentes. Pensado para pegarse como
 * "calendario por URL" en Google Calendar — se actualiza solo cada vez
 * que Google lo vuelve a consultar (típicamente cada 12-24 horas).
 *
 * La "seguridad" acá es el id de la tienda en la URL: es un UUID
 * prácticamente imposible de adivinar, el mismo criterio que usan la
 * mayoría de los calendarios compartidos por enlace. No requiere login
 * porque Google Calendar no puede iniciar sesión por vos al consultarlo.
 */

function formatoFechaICS(fecha: string) {
  // Solo nos interesa día y mes (el año se ignora, RRULE se encarga de repetirlo).
  const d = new Date(fecha + "T00:00:00");
  const yyyy = new Date().getFullYear(); // año "ancla", RRULE lo repite cada año
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function escaparTexto(texto: string) {
  return texto.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tiendaId: string }> }
) {
  const { tiendaId } = await params;

  const admin = crearClienteAdmin();

  const { data: tienda } = await admin
    .from("tiendas")
    .select("nombre")
    .eq("id", tiendaId)
    .maybeSingle();

  if (!tienda) {
    return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
  }

  const { data: clientes } = await admin
    .from("clientes")
    .select("id, nombre, telefono, fecha_nacimiento")
    .eq("tienda_id", tiendaId)
    .not("fecha_nacimiento", "is", null);

  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nugastore//Cumpleanos//ES",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:Cumpleaños — ${escaparTexto(tienda.nombre)}`,
    "X-WR-TIMEZONE:America/La_Paz",
  ];

  for (const c of clientes ?? []) {
    if (!c.fecha_nacimiento) continue;
    const fechaICS = formatoFechaICS(c.fecha_nacimiento);
    const nombre = c.nombre?.trim() || "Cliente";
    const descripcionPartes = [`Cliente de ${tienda.nombre}`];
    if (c.telefono) descripcionPartes.push(`Teléfono: ${c.telefono}`);

    lineas.push(
      "BEGIN:VEVENT",
      `UID:cumple-${c.id}@nugastore`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      `DTSTART;VALUE=DATE:${fechaICS}`,
      "RRULE:FREQ=YEARLY",
      `SUMMARY:🎂 Cumpleaños de ${escaparTexto(nombre)}`,
      `DESCRIPTION:${escaparTexto(descripcionPartes.join(" · "))}`,
      "END:VEVENT"
    );
  }

  lineas.push("END:VCALENDAR");

  return new NextResponse(lineas.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
