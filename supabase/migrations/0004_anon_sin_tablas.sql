-- Segunda capa: los visitantes sin sesión no tocan tablas.
-- El catálogo público se lee solo con search_catalog / get_catalog_product.
revoke all on public.profiles, public.products, public.payments from anon;
