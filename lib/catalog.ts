import "server-only";
import { supabaseConfigured, isCategory } from "./config";
import { DEMO_PRODUCTS, demoSearch } from "./demo";
import { createClient } from "./supabase/server";
import type { CatalogItem, CatalogProduct } from "./types";

export const PAGE_SIZE = 24;

export async function searchCatalog(opts: { q?: string; cat?: string; page?: number }) {
  const q = opts.q?.trim().slice(0, 80) || null;
  const cat = isCategory(opts.cat) ? opts.cat : null;
  const page = Math.max(1, opts.page ?? 1);

  if (!supabaseConfigured) {
    const items = demoSearch(q ?? undefined, cat ?? undefined);
    return { items, total: items.length, demo: true };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_catalog", {
    q,
    cat,
    lim: PAGE_SIZE,
    off: (page - 1) * PAGE_SIZE,
  });
  if (error) throw error;
  const items = (data ?? []) as CatalogItem[];
  return { items, total: Number(items[0]?.total ?? 0), demo: false };
}

export async function getProduct(id: string): Promise<CatalogProduct | null> {
  if (!supabaseConfigured) return DEMO_PRODUCTS.find((p) => p.id === id) ?? null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_catalog_product", { pid: id });
  return (data?.[0] as CatalogProduct | undefined) ?? null;
}
