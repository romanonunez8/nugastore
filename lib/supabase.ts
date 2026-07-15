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
};

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
