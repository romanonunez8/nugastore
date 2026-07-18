-- =========================================================
-- NUGASTORE — Schema v3
-- RLS por tienda en catálogo + bucket de fotos de productos
-- Ejecutar en Supabase → SQL Editor (después de schema v2 y storage_logos_setup)
-- =========================================================

-- =========================================================
-- 1. RLS: CATEGORIAS
-- =========================================================
alter table categorias enable row level security;

drop policy if exists "publico_lee_categorias_activas" on categorias;
create policy "publico_lee_categorias_activas" on categorias
  for select using (activa = true or fn_rol_usuario(tienda_id) in ('admin_tienda','editor') or fn_es_superadmin());

drop policy if exists "tienda_gestiona_sus_categorias" on categorias;
create policy "tienda_gestiona_sus_categorias" on categorias
  for insert with check (fn_rol_usuario(tienda_id) in ('admin_tienda','editor') or fn_es_superadmin());

drop policy if exists "tienda_edita_sus_categorias" on categorias;
create policy "tienda_edita_sus_categorias" on categorias
  for update using (fn_rol_usuario(tienda_id) in ('admin_tienda','editor') or fn_es_superadmin());

drop policy if exists "tienda_borra_sus_categorias" on categorias;
create policy "tienda_borra_sus_categorias" on categorias
  for delete using (fn_rol_usuario(tienda_id) in ('admin_tienda','editor') or fn_es_superadmin());

-- =========================================================
-- 2. RLS: PRODUCTOS
-- =========================================================
alter table productos enable row level security;

-- Lectura pública: solo productos activos de tiendas visibles. El admin de la tienda ve todo lo suyo (incluso inactivo).
drop policy if exists "publico_lee_productos_activos" on productos;
create policy "publico_lee_productos_activos" on productos
  for select using (
    (activo = true and fn_tienda_visible(tienda_id) = true)
    or fn_rol_usuario(tienda_id) in ('admin_tienda','editor')
    or fn_es_superadmin()
  );

drop policy if exists "tienda_crea_sus_productos" on productos;
create policy "tienda_crea_sus_productos" on productos
  for insert with check (fn_rol_usuario(tienda_id) in ('admin_tienda','editor') or fn_es_superadmin());

drop policy if exists "tienda_edita_sus_productos" on productos;
create policy "tienda_edita_sus_productos" on productos
  for update using (fn_rol_usuario(tienda_id) in ('admin_tienda','editor') or fn_es_superadmin());

drop policy if exists "tienda_borra_sus_productos" on productos;
create policy "tienda_borra_sus_productos" on productos
  for delete using (fn_rol_usuario(tienda_id) in ('admin_tienda','editor') or fn_es_superadmin());

-- =========================================================
-- 3. RLS: VARIANTES (heredan el permiso del producto dueño)
-- =========================================================
alter table variantes enable row level security;

drop policy if exists "publico_lee_variantes" on variantes;
create policy "publico_lee_variantes" on variantes
  for select using (true);

drop policy if exists "tienda_gestiona_sus_variantes" on variantes;
create policy "tienda_gestiona_sus_variantes" on variantes
  for all using (
    exists (
      select 1 from productos p
      where p.id = variantes.producto_id
        and (fn_rol_usuario(p.tienda_id) in ('admin_tienda','editor') or fn_es_superadmin())
    )
  )
  with check (
    exists (
      select 1 from productos p
      where p.id = variantes.producto_id
        and (fn_rol_usuario(p.tienda_id) in ('admin_tienda','editor') or fn_es_superadmin())
    )
  );

-- =========================================================
-- 4. RLS: OFERTAS
-- =========================================================
alter table ofertas enable row level security;

drop policy if exists "publico_lee_ofertas" on ofertas;
create policy "publico_lee_ofertas" on ofertas
  for select using (true);

drop policy if exists "tienda_gestiona_sus_ofertas" on ofertas;
create policy "tienda_gestiona_sus_ofertas" on ofertas
  for all using (
    -- resuelve la tienda dueña según el tipo de oferta
    case
      when tipo = 'tienda' then (fn_rol_usuario(ofertas.tienda_id) in ('admin_tienda','editor') or fn_es_superadmin())
      when tipo = 'categoria' then exists (
        select 1 from categorias c
        where c.id = ofertas.categoria_id
          and (fn_rol_usuario(c.tienda_id) in ('admin_tienda','editor') or fn_es_superadmin())
      )
      else exists (
        select 1 from productos p
        where p.id = ofertas.producto_id
          and (fn_rol_usuario(p.tienda_id) in ('admin_tienda','editor') or fn_es_superadmin())
      )
    end
  );

-- =========================================================
-- 5. RLS: VENTAS
-- =========================================================
alter table ventas enable row level security;

drop policy if exists "tienda_gestiona_sus_ventas" on ventas;
create policy "tienda_gestiona_sus_ventas" on ventas
  for all using (
    exists (
      select 1 from variantes va
      join productos p on p.id = va.producto_id
      where va.id = ventas.variante_id
        and (fn_rol_usuario(p.tienda_id) in ('admin_tienda','editor') or fn_es_superadmin())
    )
  );

-- =========================================================
-- 6. BUCKET DE STORAGE PARA FOTOS DE PRODUCTOS
-- Estructura de carpetas: {tienda_id}/{producto_id}/{archivo}
-- =========================================================
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

drop policy if exists "productos_fotos_lectura_publica" on storage.objects;
create policy "productos_fotos_lectura_publica" on storage.objects
  for select using (bucket_id = 'productos');

-- Solo puede subir/editar/borrar quien administra la tienda dueña de la carpeta (primer segmento del path = tienda_id)
drop policy if exists "productos_fotos_insert_tienda" on storage.objects;
create policy "productos_fotos_insert_tienda" on storage.objects
  for insert with check (
    bucket_id = 'productos'
    and (fn_rol_usuario(((storage.foldername(name))[1])::uuid) in ('admin_tienda','editor') or fn_es_superadmin())
  );

drop policy if exists "productos_fotos_update_tienda" on storage.objects;
create policy "productos_fotos_update_tienda" on storage.objects
  for update using (
    bucket_id = 'productos'
    and (fn_rol_usuario(((storage.foldername(name))[1])::uuid) in ('admin_tienda','editor') or fn_es_superadmin())
  );

drop policy if exists "productos_fotos_delete_tienda" on storage.objects;
create policy "productos_fotos_delete_tienda" on storage.objects
  for delete using (
    bucket_id = 'productos'
    and (fn_rol_usuario(((storage.foldername(name))[1])::uuid) in ('admin_tienda','editor') or fn_es_superadmin())
  );

-- =========================================================
-- FIN
-- =========================================================
