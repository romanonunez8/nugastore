-- =========================================================
-- NUGASTORE — Bucket de Storage para logos de tiendas
-- Ejecutar en Supabase → SQL Editor (después del schema v2)
-- =========================================================

-- 1. Crear el bucket (público para lectura, ya que los logos se muestran en la tienda)
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- 2. Cualquiera puede LEER los logos (necesario para mostrarlos en el catálogo público)
drop policy if exists "logos_lectura_publica" on storage.objects;
create policy "logos_lectura_publica" on storage.objects
  for select using (bucket_id = 'logos');

-- 3. Solo el superadmin puede SUBIR o REEMPLAZAR logos
drop policy if exists "logos_solo_superadmin_insert" on storage.objects;
create policy "logos_solo_superadmin_insert" on storage.objects
  for insert with check (bucket_id = 'logos' and fn_es_superadmin());

drop policy if exists "logos_solo_superadmin_update" on storage.objects;
create policy "logos_solo_superadmin_update" on storage.objects
  for update using (bucket_id = 'logos' and fn_es_superadmin());

drop policy if exists "logos_solo_superadmin_delete" on storage.objects;
create policy "logos_solo_superadmin_delete" on storage.objects
  for delete using (bucket_id = 'logos' and fn_es_superadmin());

-- =========================================================
-- FIN
-- =========================================================
