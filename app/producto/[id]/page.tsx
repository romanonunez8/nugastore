"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase, ofertaVigente, type Producto, type Variante } from "@/lib/supabase";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import Countdown from "@/components/Countdown";

// Número de respaldo por si la tienda aún no tiene "whatsapp" cargado en Supabase.
const NUMERO_WHATSAPP_RESPALDO = "59175643335";

export default function DetalleProductoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [producto, setProducto] = useState<Producto | null>(null);
  const [numeroWhatsapp, setNumeroWhatsapp] = useState<string>(NUMERO_WHATSAPP_RESPALDO);
  const [cargando, setCargando] = useState(true);
  const [tallaSel, setTallaSel] = useState<string | null>(null);
  const [colorSel, setColorSel] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      const { data } = await supabase
        .from("productos")
        .select("*, categorias(*), variantes(*), ofertas(*), tiendas(*)")
        .eq("id", id)
        .eq("activo", true)
        .single();

      setProducto(data ?? null);

      // El número de WhatsApp viene de la tienda dueña del producto (tabla "tiendas",
      // sección 3.2 de la guía). Si por algún motivo no está cargado, se usa el respaldo.
      const whatsappTienda = (data as any)?.tiendas?.whatsapp;
      if (whatsappTienda) setNumeroWhatsapp(whatsappTienda);

      setCargando(false);

      const tallas = (data?.variantes ?? []).filter((v: Variante) => v.stock > 0);
      if (tallas.length > 0) {
        setTallaSel(tallas[0].talla);
        setColorSel(tallas[0].color);
      }
    }
    if (id) cargar();
  }, [id]);

  const variantesDisponibles = producto?.variantes ?? [];

  const tallasUnicas = useMemo(
    () => Array.from(new Set(variantesDisponibles.map((v) => v.talla).filter(Boolean))),
    [variantesDisponibles]
  );

  const variantePicked = useMemo(() => {
    return (
      variantesDisponibles.find(
        (v) => v.talla === tallaSel && (colorSel ? v.color === colorSel : true)
      ) ?? null
    );
  }, [variantesDisponibles, tallaSel, colorSel]);

  if (cargando) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="aspect-[3/4] w-full animate-pulse rounded-card bg-white border border-line/60" />
      </main>
    );
  }

  if (!producto) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="font-display text-lg italic text-ink">
          No encontramos este producto.
        </p>
        <Link href="/" className="mt-4 inline-block font-body text-sm text-teal underline">
          Volver al catálogo
        </Link>
      </main>
    );
  }

  const oferta = ofertaVigente(producto.ofertas);
  const precioFinal = oferta ? oferta.precio_oferta : producto.precio;
  const sinStock = !variantePicked || variantePicked.stock <= 0;

  const linkWhatsApp = enlaceWhatsApp({
    numero: numeroWhatsapp,
    producto,
    variante: variantePicked,
    precioFinal,
  });

  return (
    <main className="mx-auto max-w-2xl px-4 pb-28 pt-4">
      <button
        onClick={() => router.back()}
        className="mb-3 font-body text-sm text-inkSoft underline underline-offset-2"
      >
        ← Volver
      </button>

      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-card bg-tealSoft border border-line/60">
        {producto.foto_url ? (
          <Image
            src={producto.foto_url}
            alt={producto.nombre}
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display italic text-teal/40">
            sin foto
          </div>
        )}
        {oferta && (
          <div className="ticket-tag absolute left-0 top-5 flex items-center gap-1 bg-berry py-1.5 pr-3 text-paper">
            <span className="font-display text-sm italic leading-none">Oferta</span>
          </div>
        )}
      </div>

      <div className="mt-5">
        {producto.categorias?.nombre && (
          <span className="font-body text-xs uppercase tracking-wide text-inkSoft">
            {producto.categorias.nombre}
          </span>
        )}
        <h1 className="font-display text-2xl text-ink">{producto.nombre}</h1>

        <div className="mt-2 flex items-baseline gap-2">
          {oferta ? (
            <>
              <span className="font-display text-2xl font-semibold text-berry">
                Bs {oferta.precio_oferta.toFixed(2)}
              </span>
              <span className="font-body text-sm text-inkSoft line-through">
                Bs {producto.precio.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="font-display text-2xl font-semibold text-ink">
              Bs {producto.precio.toFixed(2)}
            </span>
          )}
        </div>

        {oferta && (
          <div className="mt-1 text-berry">
            <Countdown termina={oferta.termina} />
          </div>
        )}

        {producto.descripcion && (
          <p className="mt-4 font-body text-sm leading-relaxed text-inkSoft">
            {producto.descripcion}
          </p>
        )}

        {tallasUnicas.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 font-body text-sm font-semibold text-ink">Talla</p>
            <div className="flex flex-wrap gap-2">
              {tallasUnicas.map((talla) => {
                const hayStock = variantesDisponibles.some(
                  (v) => v.talla === talla && v.stock > 0
                );
                return (
                  <button
                    key={talla}
                    disabled={!hayStock}
                    onClick={() => setTallaSel(talla)}
                    className={`rounded-full border px-4 py-1.5 font-body text-sm font-medium transition-colors ${
                      tallaSel === talla
                        ? "border-ink bg-ink text-paper"
                        : hayStock
                        ? "border-line bg-white text-ink"
                        : "border-line bg-white text-inkSoft/40 line-through"
                    }`}
                  >
                    {talla}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <p className="mt-4 font-body text-xs text-inkSoft">
          Código: {producto.codigo}
        </p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper/95 p-4 backdrop-blur">
        <a
          href={sinStock ? undefined : linkWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={sinStock}
          className={`mx-auto flex max-w-2xl items-center justify-center gap-2 rounded-full py-3.5 font-body text-base font-semibold text-white transition-opacity ${
            sinStock ? "bg-inkSoft/40 pointer-events-none" : "bg-whatsapp hover:opacity-90"
          }`}
        >
          {sinStock ? "Sin stock en esta talla" : "Comprar por WhatsApp"}
        </a>
      </div>
    </main>
  );
}
