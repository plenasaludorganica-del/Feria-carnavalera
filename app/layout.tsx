import type { Metadata, Viewport } from "next";
import { Bagel_Fat_One, Bricolage_Grotesque } from "next/font/google";
import ScrollFX from "@/components/ScrollFX";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
// Provisoria para la marca, hasta integrar las letras de Higgsfield (ver components/BrandWordmark.tsx)
const bagel = Bagel_Fat_One({ subsets: ["latin"], weight: "400", variable: "--font-bagel", display: "swap" });

export const metadata: Metadata = {
  ...(process.env.NEXT_PUBLIC_SITE_URL ? { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL) } : {}),
  title: { default: "Feria del Comparsero", template: "%s · Feria del Comparsero" },
  description: "Comprá y vendé plumas, piedrería, trajes, armazones y zapatos de comparsa usados.",
  openGraph: { images: ["/brand/fondo-plumas-brillos.webp"] },
};

export const viewport: Viewport = { themeColor: "#1b0b3f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${bricolage.variable} ${bagel.variable}`} suppressHydrationWarning>
      <head>
        {/* Activa las animaciones antes de pintar (evita parpadeos). Sin JS o con
            "reducir movimiento", todo se ve quieto y completo. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('fx-on')",
          }}
        />
      </head>
      <body>
        {children}
        <ScrollFX />
      </body>
    </html>
  );
}
