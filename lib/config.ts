export const CATEGORIES = [
  { slug: "plumas", label: "Plumas", hint: "Faisán, pavo real, avestruz, marabú" },
  { slug: "piedreria", label: "Piedrería", hint: "Strass, cristales, apliques, cadenas" },
  { slug: "trajes", label: "Trajes", hint: "Completos o por partes" },
  { slug: "armazones", label: "Armazones", hint: "Espaldares, tocados, coronas" },
  { slug: "zapatos", label: "Zapatos", hint: "Botas, sandalias, plataformas" },
  { slug: "otros", label: "Otros", hint: "Todo lo demás del desfile" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export const CONDITIONS = {
  usado: "Usado",
  como_nuevo: "Como nuevo",
  nuevo: "Nuevo",
} as const;

export function categoryLabel(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? "Otros";
}

export function isCategory(v: unknown): v is CategorySlug {
  return CATEGORIES.some((c) => c.slug === v);
}

export function formatPrice(n: number, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  const [y, m, day] = d.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(y, m - 1, day),
  );
}

export const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);


export function whatsappLink(number: string, productTitle: string) {
  const text = `¡Hola! Vi "${productTitle}" en la Feria del Comparsero. ¿Sigue disponible?`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/** Normaliza un número a solo dígitos con código de país (Argentina por defecto). */
export function normalizeWhatsapp(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 10) d = "549" + d; // 351 1234567 → 5493511234567
  if (d.length === 12 && d.startsWith("54") && !d.startsWith("549")) d = "549" + d.slice(2);
  return d;
}

/** Miniatura (480px) que se sube junto a cada foto. Las imágenes de muestra no tienen. */
export function thumbUrl(src: string) {
  return src.includes("/product-images/") && src.endsWith(".webp") ? src.replace(/\.webp$/, "_t.webp") : src;
}

export function whatsappStandLink(number: string, sellerName: string) {
  const text = `¡Hola ${sellerName}! Vi tu puesto en la Feria del Comparsero.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
