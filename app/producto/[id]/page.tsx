import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import DetalleProductoCliente from "./DetalleProductoCliente";

// Cliente de solo lectura para armar las etiquetas de vista previa (Open
// Graph) que leen Facebook/WhatsApp — corre en el servidor, antes de que
// se cargue nada de JavaScript en el navegador, porque esas plataformas no
// ejecutan JS: solo leen el HTML inicial de la página.
async function obtenerProductoParaMetadata(id: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase
    .from("productos")
    .select("nombre, descripcion, precio, activo, producto_fotos(url, orden)")
    .eq("id", id)
    .eq("activo", true)
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const producto = await obtenerProductoParaMetadata(id);

  if (!producto) {
    return { title: "Producto no encontrado — Nugastore" };
  }

  const fotos = [...(producto.producto_fotos ?? [])].sort(
    (a: { orden: number }, b: { orden: number }) => a.orden - b.orden
  );
  const foto = fotos[0]?.url;
  const descripcion = producto.descripcion?.trim() || `Bs ${producto.precio} · Disponible en Nugastore`;

  return {
    title: `${producto.nombre} — Nugastore`,
    description: descripcion,
    openGraph: {
      title: producto.nombre,
      description: descripcion,
      images: foto ? [{ url: foto, width: 800, height: 1000, alt: producto.nombre }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: producto.nombre,
      description: descripcion,
      images: foto ? [foto] : [],
    },
  };
}

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DetalleProductoCliente id={id} />;
}
