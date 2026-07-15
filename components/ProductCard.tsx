import Link from "next/link";
import Image from "next/image";
import type { Producto } from "@/lib/supabase";
import { ofertaVigente, stockTotal } from "@/lib/supabase";
import Countdown from "./Countdown";

export default function ProductCard({ producto }: { producto: Producto }) {
  const oferta = ofertaVigente(producto.ofertas);
  const stock = stockTotal(producto.variantes);
  const agotado = stock <= 0;

  return (
    <Link
      href={`/producto/${producto.id}`}
      className="group flex flex-col rounded-card bg-white shadow-card overflow-hidden border border-line/60 focus-visible:outline-teal"
    >
      <div className="relative aspect-[3/4] w-full bg-tealSoft overflow-hidden">
        {producto.foto_url ? (
          <Image
            src={producto.foto_url}
            alt={producto.nombre}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display italic text-teal/40">
            sin foto
          </div>
        )}

        {oferta && (
          <div className="ticket-tag absolute left-0 top-4 flex items-center gap-1 bg-berry py-1 pr-2.5 text-paper">
            <span className="font-display text-[12px] italic leading-none">Oferta</span>
          </div>
        )}

        {agotado && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/55">
            <span className="rounded-full bg-paper px-3 py-1 font-body text-xs font-semibold uppercase tracking-wide text-ink">
              Agotado
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        {producto.categorias?.nombre && (
          <span className="font-body text-[11px] uppercase tracking-wide text-inkSoft">
            {producto.categorias.nombre}
          </span>
        )}
        <h3 className="font-display text-[15px] leading-snug text-ink line-clamp-2">
          {producto.nombre}
        </h3>

        <div className="mt-auto flex items-baseline gap-2 pt-1">
          {oferta ? (
            <>
              <span className="font-display text-[17px] font-semibold text-berry">
                Bs {oferta.precio_oferta.toFixed(2)}
              </span>
              <span className="font-body text-[12px] text-inkSoft line-through">
                Bs {producto.precio.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="font-display text-[17px] font-semibold text-ink">
              Bs {producto.precio.toFixed(2)}
            </span>
          )}
        </div>

        {oferta && (
          <div className="text-berry">
            <Countdown termina={oferta.termina} />
          </div>
        )}
      </div>
    </Link>
  );
}
