-- =========================================================
-- NUGASTORE — Schema v6
-- Redes sociales por tienda (para mostrarle al cliente quién
-- vende cada producto y cómo contactarla)
-- Ejecutar en Supabase → SQL Editor
-- =========================================================

alter table tiendas
  add column if not exists instagram text,
  add column if not exists facebook text,
  add column if not exists tiktok text;

-- =========================================================
-- FIN
-- =========================================================
