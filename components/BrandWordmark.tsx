/**
 * MARCA "FERIA DEL COMPARSERO"
 * ----------------------------
 * Cuando tengas el logotipo/letras de Higgsfield:
 *   1) Guardalo en /public/brand/ (PNG transparente, SVG o WebP).
 *   2) Poné NEXT_PUBLIC_BRAND_WORDMARK=/brand/tu-archivo.png en .env.local
 * Hasta entonces se muestra una versión provisoria (no tipografía de sistema).
 */
const SRC = process.env.NEXT_PUBLIC_BRAND_WORDMARK;

export default function BrandWordmark({ size = "lg" }: { size?: "lg" | "sm" }) {
  if (SRC) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={SRC} alt="Feria del Comparsero" fetchPriority={size === "lg" ? "high" : "auto"} />;
  }
  return (
    <span className={`wordmark-temp${size === "sm" ? " wordmark-sm" : ""}`} data-placeholder="higgsfield-wordmark">
      <span>Feria del </span>
      <span>Comparsero</span>
    </span>
  );
}
