-- =========================================================
-- NUGASTORE — Schema v9
-- Corrige fn_precio_vigente: tenía una línea "placeholder" desde
-- el schema v2 que nunca se limpió del todo, y en ciertos casos
-- mezclaba el precio (numeric) con el id de categoría/tienda (uuid),
-- causando el error "invalid input syntax for type numeric" al
-- registrar una venta.
-- Ejecutar en Supabase → SQL Editor
-- =========================================================

create or replace function fn_precio_vigente(p_producto_id uuid)
returns numeric
language plpgsql
stable
as $$
declare
  v_precio numeric;
  v_oferta record;
begin
  select p.precio into v_precio from productos p where p.id = p_producto_id;

  -- 1) oferta directa al producto
  select * into v_oferta from ofertas o
    where o.tipo = 'producto' and o.producto_id = p_producto_id
      and now() between o.inicia and o.termina
    limit 1;

  -- 2) oferta a nivel categoría
  if v_oferta is null then
    select o.* into v_oferta from ofertas o
      join productos p on p.categoria_id = o.categoria_id
      where o.tipo = 'categoria' and p.id = p_producto_id
        and now() between o.inicia and o.termina
      limit 1;
  end if;

  -- 3) oferta a nivel tienda
  if v_oferta is null then
    select o.* into v_oferta from ofertas o
      join productos p on p.tienda_id = o.tienda_id
      where o.tipo = 'tienda' and p.id = p_producto_id
        and now() between o.inicia and o.termina
      limit 1;
  end if;

  if v_oferta is not null then
    if v_oferta.precio_oferta is not null then
      return v_oferta.precio_oferta;
    elsif v_oferta.porcentaje is not null then
      return round(v_precio * (1 - v_oferta.porcentaje / 100.0), 2);
    end if;
  end if;

  return v_precio;
end;
$$;

-- =========================================================
-- FIN
-- =========================================================
