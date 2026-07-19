-- =========================================================
-- NUGASTORE — Schema v8
-- Registra quién hizo cada venta (para el reporte detallado)
-- Ejecutar en Supabase → SQL Editor
-- =========================================================

alter table ventas
  add column if not exists vendido_por uuid references auth.users(id),
  add column if not exists vendido_por_email text;

-- Actualiza fn_registrar_venta para que también guarde quién la hizo
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
  v_email text;
begin
  select stock, producto_id into v_stock_actual, v_producto_id
  from variantes
  where id = p_variante_id
  for update;

  if v_stock_actual is null then
    raise exception 'La variante no existe';
  end if;

  if v_stock_actual < p_cantidad then
    raise exception 'Stock insuficiente: quedan % unidades', v_stock_actual;
  end if;

  v_precio := fn_precio_vigente(v_producto_id);

  select email into v_email from auth.users where id = auth.uid();

  update variantes set stock = stock - p_cantidad where id = p_variante_id;

  insert into ventas (variante_id, cliente_id, cantidad, precio_unitario, canal, fecha, vendido_por, vendido_por_email)
  values (p_variante_id, p_cliente_id, p_cantidad, v_precio, p_canal, now(), auth.uid(), v_email)
  returning id into v_venta_id;

  return query select v_venta_id, (v_stock_actual - p_cantidad);
end;
$$;

-- =========================================================
-- FIN
-- =========================================================
