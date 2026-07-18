import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Tipos según el modelo de la sección 3.2 de la guía ---

export type Categoria = {
  id: string;
  tienda_id: string;
  nombre: string;
  orden: number;
  activa: boolean;
};

export type Oferta = {
  id: string;
  tipo: "producto" | "categoria" | "tienda";
  producto_id: string | null;
  categoria_id: string | null;
  tienda_id: string | null;
  precio_oferta: number | null;
  porcentaje: number | null;
  inicia: string;
  termina: string;
};

export type Variante = {
  id: string;
  producto_id: string;
  talla: string | null;
  color: string | null;
  stock: number;
};

export type Producto = {
  id: string;
  tienda_id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  categoria_id: string | null;
  precio: number;
  foto_url: string | null;
  activo: boolean;
  destacado?: boolean;
  categorias?: Categoria | null;
  variantes?: Variante[];
  ofertas?: Oferta[];
  producto_fotos?: ProductoFoto[];
  tiendas?: Tienda | null;
};

export type Tienda = {
  id: string;
  nombre: string;
  whatsapp: string;
  logo_url: string | null;
  moneda: string;
  slug: string;
  plan: string;
  fecha_inicio_suscripcion: string | null;
  fecha_fin_suscripcion: string | null;
  suscripcion_activa: boolean;
  visible_forzado: boolean | null;
  mensaje_whatsapp?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
};

export type Rol = "superadmin" | "admin_tienda" | "editor";

export type UsuarioTienda = {
  id: string;
  user_id: string;
  tienda_id: string | null;
  rol: Rol;
  email?: string | null;
};

export type ProductoFoto = {
  id: string;
  producto_id: string;
  url: string;
  orden: number;
};

export type Venta = {
  id: string;
  variante_id: string;
  cliente_id: string | null;
  cantidad: number;
  precio_unitario: number | null;
  fecha: string;
  canal: string;
};

export type Cliente = {
  id: string;
  tienda_id: string;
  nombre: string | null;
  telefono: string | null;
  email: string | null;
  fecha_nacimiento: string | null;
  notas: string | null;
};

/** Visibilidad real de una tienda: el override manual manda sobre el estado de suscripción. */
export function tiendaVisible(tienda: Pick<Tienda, "visible_forzado" | "suscripcion_activa">) {
  return tienda.visible_forzado ?? tienda.suscripcion_activa;
}

/** Genera un slug simple a partir del nombre de la tienda (sin acentos, minúsculas, guiones). */
export function generarSlug(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Devuelve la oferta activa aplicable a un producto, respetando la prioridad
 * producto > categoría > tienda (la misma lógica que fn_precio_vigente en SQL). */
export function ofertaAplicable(
  producto: Pick<Producto, "id" | "categoria_id" | "tienda_id">,
  ofertas: Oferta[],
  ahora = new Date()
): Oferta | null {
  const activas = ofertas.filter((o) => new Date(o.inicia) <= ahora && ahora <= new Date(o.termina));

  const deProducto = activas.find((o) => o.tipo === "producto" && o.producto_id === producto.id);
  if (deProducto) return deProducto;

  const deCategoria = activas.find(
    (o) => o.tipo === "categoria" && o.categoria_id === producto.categoria_id
  );
  if (deCategoria) return deCategoria;

  const deTienda = activas.find((o) => o.tipo === "tienda" && o.tienda_id === producto.tienda_id);
  if (deTienda) return deTienda;

  return null;
}

/** Calcula el precio final aplicando la oferta (precio fijo o porcentaje). */
export function precioConOferta(precio: number, oferta: Oferta | null) {
  if (!oferta) return precio;
  if (oferta.precio_oferta != null) return oferta.precio_oferta;
  if (oferta.porcentaje != null) return Math.round(precio * (1 - oferta.porcentaje / 100) * 100) / 100;
  return precio;
}

/** Foto de portada: la primera del carrusel (por orden), con respaldo al campo viejo foto_url. */
export function fotoPortada(producto: Producto): string | null {
  if (producto.producto_fotos && producto.producto_fotos.length > 0) {
    const ordenadas = [...producto.producto_fotos].sort((a, b) => a.orden - b.orden);
    return ordenadas[0].url;
  }
  return producto.foto_url ?? null;
}

/** Suma el stock de todas las variantes de un producto. */
export function stockTotal(variantes: Variante[] | undefined) {
  if (!variantes || variantes.length === 0) return 0;
  return variantes.reduce((total, v) => total + v.stock, 0);
}
