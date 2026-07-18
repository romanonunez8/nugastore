-- =========================================================
-- NUGASTORE — Schema v7
-- El admin de tienda también puede subir el logo de su propia
-- tienda (antes esto era exclusivo del superadmin)
-- Ejecutar en Supabase → SQL Editor
-- =========================================================

drop policy if exists "logos_solo_superadmin_insert" on storage.objects;
create policy "logos_admin_tienda_insert" on storage.objects
  for insert with check (
    bucket_id = 'logos'
    and (
      fn_es_superadmin()
      or exists (select 1 from usuarios_tienda ut where ut.user_id = auth.uid() and ut.rol = 'admin_tienda')
    )
  );

-- Actualizar/reemplazar un logo existente: igual criterio
drop policy if exists "logos_solo_superadmin_update" on storage.objects;
create policy "logos_admin_tienda_update" on storage.objects
  for update using (
    bucket_id = 'logos'
    and (
      fn_es_superadmin()
      or exists (select 1 from usuarios_tienda ut where ut.user_id = auth.uid() and ut.rol = 'admin_tienda')
    )
  );

-- Borrar queda reservado al superadmin (evita que alguien borre logos de otras tiendas por error)
-- La política "logos_solo_superadmin_delete" ya existente se mantiene sin cambios.

-- =========================================================
-- FIN
-- =========================================================
