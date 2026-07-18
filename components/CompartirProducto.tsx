"use client";

import { useState } from "react";

/**
 * Bloque para que el cliente comparta un producto con amigos o en sus redes:
 * copiar enlace, mandar por WhatsApp a quien elija, o publicar en Facebook.
 */
export default function CompartirProducto({ nombre }: { nombre: string }) {
  const [copiado, setCopiado] = useState(false);

  function urlActual() {
    return typeof window !== "undefined" ? window.location.href : "";
  }

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(urlActual());
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Si el navegador bloquea el portapapeles, simplemente no mostramos la confirmación.
    }
  }

  function compartirWhatsApp() {
    const texto = encodeURIComponent(`Mira este producto: ${nombre} ${urlActual()}`);
    window.open(`https://wa.me/?text=${texto}`, "_blank", "noopener,noreferrer");
  }

  function compartirFacebook() {
    const url = encodeURIComponent(urlActual());
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank",
      "noopener,noreferrer,width=600,height=500"
    );
  }

  return (
    <div className="mt-6 rounded-card border border-line bg-white p-4">
      <p className="font-body text-sm font-semibold text-ink">
        Recomendá este producto a un amigo
      </p>
      <p className="mb-3 font-body text-xs text-inkSoft">o compartilo en tus redes</p>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={copiarEnlace}
          className="rounded-full border border-line px-3 py-1.5 font-body text-xs font-medium text-ink transition-colors"
        >
          {copiado ? "¡Enlace copiado!" : "Copiar enlace"}
        </button>
        <button
          onClick={compartirWhatsApp}
          className="rounded-full border border-line px-3 py-1.5 font-body text-xs font-medium text-whatsapp"
        >
          Compartir por WhatsApp
        </button>
        <button
          onClick={compartirFacebook}
          className="rounded-full border border-line px-3 py-1.5 font-body text-xs font-medium text-ink"
        >
          Publicar en Facebook
        </button>
      </div>
    </div>
  );
}
