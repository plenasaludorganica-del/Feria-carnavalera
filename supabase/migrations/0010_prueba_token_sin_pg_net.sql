-- Se habilitó pg_net solo para verificar el token de Mercado Pago desde la base
-- (sin exponerlo) y se volvió a quitar. No deja cambios.
drop extension if exists pg_net;
