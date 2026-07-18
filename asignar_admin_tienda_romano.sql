-- Asigna el rol de admin_tienda a romanonunez@outlook.com en la tienda "romano"
-- Ejecutar DESPUÉS de crear el usuario en Authentication → Users

insert into usuarios_tienda (user_id, tienda_id, rol, email)
select
  u.id,
  t.id,
  'admin_tienda',
  u.email
from auth.users u
cross join tiendas t
where u.email = 'romanonunez@outlook.com'
  and t.nombre = 'romano'
on conflict (user_id, tienda_id) do update set rol = 'admin_tienda';

-- Verificación: debería devolver una fila con rol = admin_tienda y el nombre de la tienda
select ut.rol, u.email, t.nombre as tienda
from usuarios_tienda ut
join auth.users u on u.id = ut.user_id
join tiendas t on t.id = ut.tienda_id
where u.email = 'romanonunez@outlook.com';
