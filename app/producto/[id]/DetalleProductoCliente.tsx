"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  supabase,
  ofertaAplicable,
  precioConOferta,
  type Producto,
  type Variante,
  type Oferta,
} from "@/lib/supabase";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import Countdown from "@/components/Countdown";
import TiendaBadge from "@/components/TiendaBadge";
import CompartirProducto from "@/components/CompartirProducto";

// Número de respaldo por si la tienda aún no tiene "whatsapp" cargado en Supabase.
const NUMERO_WHATSAPP_RESPALDO = "59175643335";

export default function DetalleProductoCliente({ id }: { id: string }) {
  const router = useRouter();

  const [producto, setProducto] = useState<Producto | null>(null);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [numeroWhatsapp, setNumeroWhatsapp] = useState<string>(NUMERO_WHATSAPP_RESPALDO);
  const [plantillaWhatsapp, setPlantillaWhatsapp] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [tallaSel, setTallaSel] = useState<string | null>(null);
  const [colorSel, setColorSel] = useState<string | null>(null);
  const [fotoActiva, setFotoActiva] = useState(0);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      const [{ data }, { data: ofs }] = await Promise.all([
        supabase
          .from("productos")
          .select("*, categorias(*), variantes(*), producto_fotos(*), tiendas(*)")
          .eq("id", id)
          .eq("activo", true)
          .single(),
        supabase.from("ofertas").select("*"),
      ]);

      setProducto(data ?? null);
      setOfertas(ofs ?? []);

      // El número de WhatsApp viene de la tienda dueña del producto (tabla "tiendas",
      // sección 3.2 de la guía). Si por algún motivo no está cargado, se usa el respaldo.
      const whatsappTienda = (data as any)?.tiendas?.whatsapp;
      if (whatsappTienda) setNumeroWhatsapp(whatsappTienda);
      setPlantillaWhatsapp((data as any)?.tiendas?.mensaje_whatsapp ?? null);

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

  const fotos = useMemo(() => {
    const lista = [...(producto?.producto_fotos ?? [])].sort((a, b) => a.orden - b.orden);
    if (lista.length > 0) return lista.map((f) => f.url);
    return producto?.foto_url ? [producto.foto_url] : [];
  }, [producto]);

  const tallasUnicas = useMemo(
    () => Array.from(new Set(variantesDisponibles.map((v) => v.talla).filter(Boolean))),
    [variantesDisponibles]
  );

  // Colores disponibles para la talla actualmente elegida (si el producto no
  // usa tallas, se consideran todas las variantes).
  const coloresParaTalla = useMemo(() => {
    const relevantes = tallasUnicas.length > 0
      ? variantesDisponibles.filter((v) => v.talla === tallaSel)
      : variantesDisponibles;
    return Array.from(new Set(relevantes.map((v) => v.color).filter(Boolean)));
  }, [variantesDisponibles, tallasUnicas, tallaSel]);

  // Si cambia la talla y el color elegido ya no aplica a esa talla, se ajusta solo.
  useEffect(() => {
    if (coloresParaTalla.length > 0 && !coloresParaTalla.includes(colorSel)) {
      setColorSel(coloresParaTalla[0]);
    }
    if (coloresParaTalla.length === 0) {
      setColorSel(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tallaSel, coloresParaTalla.join("|")]);

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

  const oferta = ofertaAplicable(producto, ofertas);
  const precioFinal = precioConOferta(producto.precio, oferta);
  const sinStock = !variantePicked || variantePicked.stock <= 0;

  const linkWhatsApp = enlaceWhatsApp({
    numero: numeroWhatsapp,
    producto,
    variante: variantePicked,
    precioFinal,
    plantilla: plantillaWhatsapp,
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
        {fotos.length > 0 ? (
          <Image
            src={fotos[fotoActiva] ?? fotos[0]}
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

      {fotos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {fotos.map((url, i) => (
            <button
              key={url + i}
              onClick={() => setFotoActiva(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-card border ${
                i === fotoActiva ? "border-teal" : "border-line/60"
              }`}
            >
              <Image src={url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          {producto.categorias?.nombre ? (
            <span className="font-body text-xs uppercase tracking-wide text-inkSoft">
              {producto.categorias.nombre}
            </span>
          ) : (
            <span />
          )}
          <TiendaBadge tienda={producto.tiendas} />
        </div>
        <h1 className="font-display text-2xl text-ink">{producto.nombre}</h1>

        <div className="mt-2 flex items-baseline gap-2">
          {oferta ? (
            <>
              <span className="font-display text-2xl font-semibold text-berry">
                Bs {precioFinal.toFixed(2)}
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

        {coloresParaTalla.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 font-body text-sm font-semibold text-ink">Color</p>
            <div className="flex flex-wrap gap-2">
              {coloresParaTalla.map((color) => {
                const hayStock = variantesDisponibles.some(
                  (v) =>
                    v.color === color &&
                    (tallasUnicas.length === 0 || v.talla === tallaSel) &&
                    v.stock > 0
                );
                return (
                  <button
                    key={color}
                    disabled={!hayStock}
                    onClick={() => setColorSel(color)}
                    className={`rounded-full border px-4 py-1.5 font-body text-sm font-medium transition-colors ${
                      colorSel === color
                        ? "border-ink bg-ink text-paper"
                        : hayStock
                        ? "border-line bg-white text-ink"
                        : "border-line bg-white text-inkSoft/40 line-through"
                    }`}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <p className="mt-4 font-body text-xs text-inkSoft">
          Código: {producto.codigo}
        </p>

        <CompartirProducto nombre={producto.nombre} />
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
