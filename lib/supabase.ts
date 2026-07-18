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
  producto_id: string;
  precio_oferta: number;
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

/** Devuelve la oferta vigente de un producto (si existe), comparando con la hora actual. */
export function ofertaVigente(ofertas: Oferta[] | undefined, ahora = new Date()) {
  if (!ofertas || ofertas.length === 0) return null;
  return (
    ofertas.find((o) => {
      const inicia = new Date(o.inicia);
      const termina = new Date(o.termina);
      return ahora >= inicia && ahora <= termina;
    }) ?? null
  );
}

/** Suma el stock de todas las variantes de un producto. */
export function stockTotal(variantes: Variante[] | undefined) {
  if (!variantes || variantes.length === 0) return 0;
  return variantes.reduce((total, v) => total + v.stock, 0);
}
