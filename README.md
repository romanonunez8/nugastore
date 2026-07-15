# Nugastore

Catálogo web con cierre de venta por WhatsApp. Next.js 14 (App Router) + Tailwind CSS + Supabase.
Generado según la Guía del PM, sección 3.3.

## 1. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Completa `.env.local` con:
- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase → Project Settings → API, sección 3.1 de la guía).
- `NEXT_PUBLIC_WHATSAPP_NUMERO`: tu número con código de país, sin `+` ni espacios (ej: `59171234567`).

## 2. Instalar y correr en local

```bash
npm install
npm run dev
```

Abre http://localhost:3000

## 3. Qué incluye

- **`/`** — Grilla de productos con foto, nombre, precio, distintivo de oferta con cuenta regresiva, filtro por categoría y buscador. Oculta productos sin stock o inactivos.
- **`/producto/[id]`** — Detalle con fotos, descripción, selector de talla según stock, precio (tachado si hay oferta) y botón grande "Comprar por WhatsApp".
- El botón de WhatsApp arma automáticamente el mensaje con código, nombre, talla, color, precio y la URL de la foto (ver `lib/whatsapp.ts`).
- Diseño mobile-first: paleta cálida (paper/ink/marigold/teal/berry), tipografía Fraunces + Inter, y una etiqueta de oferta estilo "ticket de mercado" como elemento distintivo.

## 4. Subir a GitHub y desplegar (secciones 3.5 y 3.6 de la guía)

```bash
git init
git add .
git commit -m "Primera versión de nugastore"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/nugastore.git
git push -u origin main
```

Luego en Cloudflare Pages: **Workers & Pages → Create → Pages → Connect to Git**, elige el repo `nugastore`,
framework preset **Next.js**, y agrega las mismas variables de entorno del paso 1 (más `NEXT_PUBLIC_WHATSAPP_NUMERO`).

## 5. Siguiente paso

Con esto completas el MVP de la Fase 1. La Fase 2 (panel `/admin` para gestionar productos e inventario
desde el celular) se agrega después, sobre esta misma base.
