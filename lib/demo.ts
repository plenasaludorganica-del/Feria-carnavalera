import type { CatalogItem, CatalogProduct } from "./types";

/**
 * Productos de muestra: SOLO se usan mientras Supabase no está configurado,
 * para poder ver el diseño. Con Supabase conectado se muestran los reales.
 */

const now = new Date().toISOString();
export const DEMO_PRODUCTS: CatalogProduct[] = [
  {
    id: "demo-1", title: "Lote de plumas de faisán, 60 a 80 cm", price: 85000, currency: "ARS",
    category: "plumas", condition: "usado", created_at: now,
    description: "Unas 40 plumas de faisán venerado, usadas en un solo carnaval. Algunas tienen la punta un poco abierta, se ve en las fotos. Ideales para espaldar.",
    images: ["/brand/plumas.webp"], seller_id: "demo-arabera", seller_name: "Comparsa Ará Berá", seller_city: "Gualeguaychú", whatsapp: "5493446000000",
  },
  {
    id: "demo-2", title: "Corona de piedrería con cristales AB", price: 42000, currency: "ARS",
    category: "piedreria", condition: "como_nuevo", created_at: now,
    description: "Corona armada a mano con strass y gotas de cristal. Se usó para una sola salida.",
    images: ["/brand/coronas-piedreria.webp"], seller_id: "demo-mili", seller_name: "Mili Rodríguez", seller_city: "Corrientes", whatsapp: "5493794000000",
  },
  {
    id: "demo-3", title: "Traje de pasista completo, talle S", price: 320000, currency: "ARS",
    category: "trajes", condition: "usado", created_at: now,
    description: "Incluye tocado, top bordado, cola y brazaletes. Plumas de pavo real y marabú.",
    images: ["/brand/comparsera.webp"], seller_id: "demo-brillo", seller_name: "Taller Brillo Sur", seller_city: "Montevideo", whatsapp: "59899000000",
  },
  {
    id: "demo-4", title: "Tocado de destaque masculino con espaldar", price: 210000, currency: "ARS",
    category: "tocados", condition: "usado", created_at: now,
    description: "Armazón de alambre y goma eva, con plumas y apliques. Se desarma para transportar.",
    images: ["/brand/comparsero.webp"], seller_id: "demo-lucas", seller_name: "Lucas P.", seller_city: "Concordia", whatsapp: "5493454000000",
  },
  {
    id: "demo-5", title: "Plumas de pavo real sueltas x 100", price: 38000, currency: "ARS",
    category: "plumas", condition: "nuevo", created_at: now,
    description: "Cien plumas de pavo real con ojo entero, de 90 cm.",
    images: ["/brand/fondo-plumas-brillos.webp"], seller_id: "demo-arabera", seller_name: "Comparsa Ará Berá", seller_city: "Gualeguaychú", whatsapp: "5493446000000",
  },
  {
    id: "demo-6", title: "Sandalias de plataforma con strass, n° 38", price: 27000, currency: "ARS",
    category: "zapatos", condition: "usado", created_at: now,
    description: "Plataforma de 12 cm forrada en strass. Firmes para desfilar toda la noche.",
    images: [], seller_id: "demo-mili", seller_name: "Mili Rodríguez", seller_city: "Corrientes", whatsapp: "5493794000000",
  },
];

export function demoSearch(q?: string, cat?: string): CatalogItem[] {
  const needle = (q ?? "").toLowerCase();
  return DEMO_PRODUCTS.filter(
    (p) =>
      (!cat || p.category === cat) &&
      (!needle || p.title.toLowerCase().includes(needle) || p.description.toLowerCase().includes(needle)),
  ).map((p) => ({ ...p, cover: p.images[0] ?? null, city: p.seller_city }));
}
