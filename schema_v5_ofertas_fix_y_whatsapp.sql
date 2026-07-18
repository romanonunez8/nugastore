-- =========================================================
-- NUGASTORE — Schema v5
-- Corrige precio_oferta NOT NULL (bloqueaba ofertas por %) y
-- agrega plantilla de mensaje de WhatsApp personalizable por tienda
-- Ejecutar en Supabase → SQL Editor
-- =========================================================

-- 1. precio_oferta ya no es obligatorio (una oferta puede ser solo por porcentaje)
alter table ofertas alter column precio_oferta drop not null;

-- 2. Plantilla de mensaje de WhatsApp editable por cada tienda.
--    Placeholders disponibles: {codigo} {nombre} {talla} {color} {precio} {foto}
--    Si una línea usa un placeholder y ese dato no aplica (ej. producto sin talla),
--    esa línea se omite automáticamente del mensaje final.
alter table tiendas add column if not exists mensaje_whatsapp text;

-- 3. Solo el admin_tienda (no un vendedor) puede editar la configuración de su tienda
--    (logo, WhatsApp, plantilla de mensaje) — antes el rol editor también podía.
drop policy if exists "admin_tienda_update_propia" on tiendas;
create policy "admin_tienda_update_propia" on tiendas
  for update using (fn_rol_usuario(id) = 'admin_tienda' or fn_es_superadmin());

-- =========================================================
-- FIN
-- =========================================================
