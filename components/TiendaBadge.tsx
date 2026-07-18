"use client";

import { useState } from "react";
import type { Tienda } from "@/lib/supabase";

/**
 * Logo pequeño y clickeable de la tienda dueña de un producto. Al tocarlo,
 * abre una ficha con su WhatsApp y redes sociales. Pensado para usarse
 * dentro de tarjetas que son a su vez un <Link> (ProductCard): por eso
 * detiene la propagación del clic, para no disparar la navegación.
 */
export default function TiendaBadge({ tienda }: { tienda?: Tienda | null }) {
  const [abierto, setAbierto] = useState(false);

  if (!tienda) return null;

  function abrir(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setAbierto(true);
  }

  function cerrar(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setAbierto(false);
  }

  const redes = [
    tienda.instagram ? { label: "Instagram", url: tienda.instagram } : null,
    tienda.facebook ? { label: "Facebook", url: tienda.facebook } : null,
    tienda.tiktok ? { label: "TikTok", url: tienda.tiktok } : null,
  ].filter((r): r is { label: string; url: string } => r !== null);

  return (
    <>
      <button
        onClick={abrir}
        className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-2 py-1 border border-line/60 shadow-sm"
      >
        {tienda.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tienda.logo_url}
            alt={tienda.nombre}
            className="w-4 h-4 rounded-full object-cover"
          />
        ) : (
          <span className="w-4 h-4 rounded-full bg-tealSoft" />
        )}
        <span className="font-body text-[11px] font-medium text-ink">{tienda.nombre}</span>
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 p-4"
          onClick={cerrar}
        >
          <div
            className="w-full max-w-sm rounded-card bg-white p-5 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              {tienda.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tienda.logo_url}
                  alt={tienda.nombre}
                  className="h-12 w-12 rounded-full object-cover border border-line"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-tealSoft" />
              )}
              <h3 className="font-display text-lg text-ink">{tienda.nombre}</h3>
            </div>

            {tienda.whatsapp && (
              <a
                href={`https://wa.me/${tienda.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-2 flex items-center gap-2 rounded-card bg-whatsapp/10 px-3 py-2 font-body text-sm font-medium text-whatsapp"
              >
                WhatsApp: {tienda.whatsapp}
              </a>
            )}

            {redes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {redes.map((r) => (
                  <a
                    key={r.label}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-line px-3 py-1.5 font-body text-xs font-medium text-ink"
                  >
                    {r.label}
                  </a>
                ))}
              </div>
            )}

            <button
              onClick={cerrar}
              className="mt-4 w-full text-center font-body text-sm text-inkSoft underline underline-offset-2"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
