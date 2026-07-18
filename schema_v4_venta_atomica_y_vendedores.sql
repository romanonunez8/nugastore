-- =========================================================
-- NUGASTORE — Schema v4
-- Venta atómica (evita sobreventa) + rol "vendedor" restringido
-- + el admin de tienda puede gestionar su propio equipo
-- Ejecutar en Supabase → SQL Editor
-- =========================================================

-- =========================================================
-- 1. VENTA ATÓMICA (evita sobreventa por condiciones de carrera)
-- =========================================================
create or replace function fn_registrar_venta(
  p_variante_id uuid,
  p_cantidad int,
  p_cliente_id uuid,
  p_canal text
)
returns table (venta_id uuid, stock_restante int)
language plpgsql
security definer
as $$
declare
  v_producto_id uuid;
  v_precio numeric;
  v_stock_actual int;
  v_venta_id uuid;
begin
  select stock, producto_id into v_stock_actual, v_producto_id
  from variantes
  where id = p_variante_id
  for update; -- bloquea la fila: si otro usuario vende lo mismo a la vez, espera su turno

  if v_stock_actual is null then
    raise exception 'La variante no existe';
  end if;

  if v_stock_actual < p_cantidad then
    raise exception 'Stock insuficiente: quedan % unidades', v_stock_actual;
  end if;

  v_precio := fn_precio_vigente(v_producto_id);

  update variantes set stock = stock - p_cantidad where id = p_variante_id;

  insert into ventas (variante_id, cliente_id, cantidad, precio_unitario, canal, fecha)
  values (p_variante_id, p_cliente_id, p_cantidad, v_precio, p_canal, now())
  returning id into v_venta_id;

  return query select v_venta_id, (v_stock_actual - p_cantidad);
end;
$$;

-- =========================================================
-- 2. COLUMNA EMAIL EN usuarios_tienda (para mostrar el equipo sin
--    necesitar acceso directo a auth.users, que está restringido)
-- =========================================================
alter table usuarios_tienda add column if not exists email text;

-- =========================================================
-- 3. EL ADMIN DE TIENDA PUEDE VER Y GESTIONAR SU PROPIO EQUIPO
--    (solo puede crear/quitar vendedores — rol 'editor' — nunca
--    otro admin_tienda ni superadmin)
-- =========================================================
drop policy if exists "admin_tienda_ve_su_equipo" on usuarios_tienda;
create policy "admin_tienda_ve_su_equipo" on usuarios_tienda
  for select using (
    user_id = auth.uid()
    or fn_rol_usuario(tienda_id) = 'admin_tienda'
    or fn_es_superadmin()
  );

drop policy if exists "admin_tienda_agrega_vendedores" on usuarios_tienda;
create policy "admin_tienda_agrega_vendedores" on usuarios_tienda
  for insert with check (
    (rol = 'editor' and fn_rol_usuario(tienda_id) = 'admin_tienda')
    or fn_es_superadmin()
  );

drop policy if exists "admin_tienda_quita_vendedores" on usuarios_tienda;
create policy "admin_tienda_quita_vendedores" on usuarios_tienda
  for delete using (
    (rol = 'editor' and fn_rol_usuario(tienda_id) = 'admin_tienda')
    or fn_es_superadmin()
  );

-- =========================================================
-- 4. RESTRINGIR AL ROL 'editor' (vendedor): sin acceso de escritura
--    a productos, categorías y ofertas — solo lectura.
--    (La venta se hace vía fn_registrar_venta, que sigue funcionando
--    para el vendedor porque es SECURITY DEFINER.)
-- =========================================================

-- Categorías: solo admin_tienda escribe
drop policy if exists "tienda_gestiona_sus_categorias" on categorias;
create policy "tienda_gestiona_sus_categorias" on categorias
  for insert with check (fn_rol_usuario(tienda_id) = 'admin_tienda' or fn_es_superadmin());

drop policy if exists "tienda_edita_sus_categorias" on categorias;
create policy "tienda_edita_sus_categorias" on categorias
  for update using (fn_rol_usuario(tienda_id) = 'admin_tienda' or fn_es_superadmin());

drop policy if exists "tienda_borra_sus_categorias" on categorias;
create policy "tienda_borra_sus_categorias" on categorias
  for delete using (fn_rol_usuario(tienda_id) = 'admin_tienda' or fn_es_superadmin());

-- Productos: solo admin_tienda escribe
drop policy if exists "tienda_crea_sus_productos" on productos;
create policy "tienda_crea_sus_productos" on productos
  for insert with check (fn_rol_usuario(tienda_id) = 'admin_tienda' or fn_es_superadmin());

drop policy if exists "tienda_edita_sus_productos" on productos;
create policy "tienda_edita_sus_productos" on productos
  for update using (fn_rol_usuario(tienda_id) = 'admin_tienda' or fn_es_superadmin());

drop policy if exists "tienda_borra_sus_productos" on productos;
create policy "tienda_borra_sus_productos" on productos
  for delete using (fn_rol_usuario(tienda_id) = 'admin_tienda' or fn_es_superadmin());

-- Variantes: solo admin_tienda edita directamente (el vendedor descuenta stock vía fn_registrar_venta)
drop policy if exists "tienda_gestiona_sus_variantes" on variantes;
create policy "tienda_gestiona_sus_variantes" on variantes
  for all using (
    exists (
      select 1 from productos p
      where p.id = variantes.producto_id
        and (fn_rol_usuario(p.tienda_id) = 'admin_tienda' or fn_es_superadmin())
    )
  )
  with check (
    exists (
      select 1 from productos p
      where p.id = variantes.producto_id
        and (fn_rol_usuario(p.tienda_id) = 'admin_tienda' or fn_es_superadmin())
    )
  );

-- Ofertas: solo admin_tienda
drop policy if exists "tienda_gestiona_sus_ofertas" on ofertas;
create policy "tienda_gestiona_sus_ofertas" on ofertas
  for all using (
    case
      when tipo = 'tienda' then (fn_rol_usuario(ofertas.tienda_id) = 'admin_tienda' or fn_es_superadmin())
      when tipo = 'categoria' then exists (
        select 1 from categorias c
        where c.id = ofertas.categoria_id
          and (fn_rol_usuario(c.tienda_id) = 'admin_tienda' or fn_es_superadmin())
      )
      else exists (
        select 1 from productos p
        where p.id = ofertas.producto_id
          and (fn_rol_usuario(p.tienda_id) = 'admin_tienda' or fn_es_superadmin())
      )
    end
  );

-- Fotos de producto: solo admin_tienda sube/edita/borra
drop policy if exists "admin_tienda_gestiona_fotos" on producto_fotos;
create policy "admin_tienda_gestiona_fotos" on producto_fotos
  for all using (
    exists (
      select 1 from productos p
      where p.id = producto_fotos.producto_id
        and (fn_rol_usuario(p.tienda_id) = 'admin_tienda' or fn_es_superadmin())
    )
  );

-- Nota: clientes queda igual (admin_tienda Y editor pueden buscar/crear clientes),
-- porque el vendedor sí necesita eso para registrar una venta con datos del comprador.

-- =========================================================
-- FIN
-- =========================================================
