"use client";

import { useEffect, useState } from "react";
import { supabase, tiendaVisible, type Tienda } from "@/lib/supabase";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { mensajeErrorAmigable } from "@/lib/errors";
import { PLANTILLA_WHATSAPP_PREDETERMINADA } from "@/lib/whatsapp";
import { SubirLogo } from "@/components/admin/SubirLogo";

export default function MiTiendaPage() {
  const { sesion } = useAdminAuth();
  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [whatsapp, setWhatsapp] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [plantilla, setPlantilla] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    if (!sesion?.tiendaId) return;
    supabase
      .from("tiendas")
      .select("*")
      .eq("id", sesion.tiendaId)
      .single()
      .then(({ data }) => {
        setTienda(data);
        setWhatsapp(data?.whatsapp ?? "");
        setLogoUrl(data?.logo_url ?? null);
        setPlantilla(data?.mensaje_whatsapp ?? "");
        setInstagram(data?.instagram ?? "");
        setFacebook(data?.facebook ?? "");
        setTiktok(data?.tiktok ?? "");
        setCargando(false);
      });
  }, [sesion]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!tienda) return;
    setError(null);
    setMensaje(null);
    setGuardando(true);

    try {
      const { error: errorUpdate } = await supabase
        .from("tiendas")
        .update({
          whatsapp,
          logo_url: logoUrl,
          mensaje_whatsapp: plantilla.trim() || null,
          instagram: instagram.trim() || null,
          facebook: facebook.trim() || null,
          tiktok: tiktok.trim() || null,
        })
        .eq("id", tienda.id);

      if (errorUpdate) throw errorUpdate;

      setTienda({ ...tienda, logo_url: logoUrl });
      setMensaje("Guardado correctamente.");
    } catch (err) {
      setError(`No se pudo guardar: ${mensajeErrorAmigable(err)}`);
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <p className="text-inkSoft">Cargando…</p>;
  if (!tienda) return <p className="text-berry">No se encontró tu tienda.</p>;

  const esVendedor = sesion?.rol === "editor";
  const visible = tiendaVisible(tienda);

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        {tienda.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tienda.logo_url}
            alt={tienda.nombre}
            className="w-16 h-16 rounded-card object-cover border border-line"
          />
        ) : (
          <div className="w-16 h-16 rounded-card bg-tealSoft" />
        )}
        <div>
          <h1 className="font-display text-2xl text-ink">{tienda.nombre}</h1>
          <p className="text-sm text-inkSoft">Plan {tienda.plan}</p>
        </div>
      </div>

      <div className="rounded-card border border-line bg-white p-5">
        <h2 className="font-medium text-ink mb-2">Estado de tu suscripción</h2>
        <p className="text-sm text-inkSoft">
          Estado actual:{" "}
          <span className={visible ? "text-teal font-medium" : "text-berry font-medium"}>
            {visible ? "Activa y visible en el catálogo" : "Oculta"}
          </span>
        </p>
        <p className="text-sm text-inkSoft">
          Vence el:{" "}
          {tienda.fecha_fin_suscripcion
            ? new Date(tienda.fecha_fin_suscripcion).toLocaleDateString("es-BO")
            : "sin fecha definida"}
        </p>
        <p className="text-xs text-inkSoft mt-2">
          Para renovar o cambiar de plan, contacta al administrador de la plataforma.
        </p>
      </div>

      {esVendedor ? (
        <div className="rounded-card border border-line bg-white p-5 text-sm text-inkSoft">
          El número de WhatsApp y el mensaje de compra los configura el administrador de la
          tienda.
        </div>
      ) : (
        <form onSubmit={guardar} className="space-y-4 rounded-card border border-line bg-white p-5">
          <h2 className="font-medium text-ink">WhatsApp para recibir pedidos</h2>

          <SubirLogo valor={logoUrl} onCambio={setLogoUrl} />

          <div>
            <label className="block text-sm text-inkSoft mb-1">
              Número (con código de país, sin + ni espacios)
            </label>
            <input
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="59171234567"
              className="w-full rounded-card border border-line px-4 py-2.5 outline-none focus:border-teal"
            />
          </div>

          <div>
            <label className="block text-sm text-inkSoft mb-1">
              Mensaje precargado al hacer clic en "Comprar por WhatsApp"
            </label>
            <textarea
              value={plantilla}
              onChange={(e) => setPlantilla(e.target.value)}
              rows={7}
              placeholder={PLANTILLA_WHATSAPP_PREDETERMINADA}
              className="w-full rounded-card border border-line px-4 py-2.5 font-mono text-sm outline-none focus:border-teal"
            />
            <p className="text-xs text-inkSoft mt-1.5">
              Dejalo vacío para usar el mensaje predeterminado. Podés usar estos textos y se
              completan solos: <code className="text-teal">{"{codigo}"}</code>{" "}
              <code className="text-teal">{"{nombre}"}</code>{" "}
              <code className="text-teal">{"{talla}"}</code>{" "}
              <code className="text-teal">{"{color}"}</code>{" "}
              <code className="text-teal">{"{precio}"}</code>{" "}
              <code className="text-teal">{"{foto}"}</code>. Si una línea usa un dato que el
              producto no tiene (por ejemplo talla), esa línea se omite sola del mensaje.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 border-t border-line pt-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm text-inkSoft mb-1">Instagram</label>
              <input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/tutienda"
                className="w-full rounded-card border border-line px-3 py-2 text-sm outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-sm text-inkSoft mb-1">Facebook</label>
              <input
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/tutienda"
                className="w-full rounded-card border border-line px-3 py-2 text-sm outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-sm text-inkSoft mb-1">TikTok</label>
              <input
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                placeholder="https://tiktok.com/@tutienda"
                className="w-full rounded-card border border-line px-3 py-2 text-sm outline-none focus:border-teal"
              />
            </div>
          </div>

          {error && <p className="text-berry text-sm">{error}</p>}
          {mensaje && <p className="text-teal text-sm">{mensaje}</p>}

          <button
            type="submit"
            disabled={guardando}
            className="rounded-card bg-teal text-white font-medium px-5 py-2.5 shadow-card disabled:opacity-60"
          >
            {guardando ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      )}
    </div>
  );
}
