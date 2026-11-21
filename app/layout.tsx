import type { Metadata, Viewport } from "next";
import { Bagel_Fat_One, Bricolage_Grotesque } from "next/font/google";
import ScrollFX from "@/components/ScrollFX";
import SmoothScroll from "@/components/SmoothScroll";
import "lenis/dist/lenis.css";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
// Provisoria para la marca, hasta integrar las letras de Higgsfield (ver components/BrandWordmark.tsx)
const bagel = Bagel_Fat_One({ subsets: ["latin"], weight: "400", variable: "--font-bagel", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://feria-carnavalera.plenasaludorganica.workers.dev"),
  title: { default: "Feria del Comparsero", template: "%s · Feria del Comparsero" },
  description: "Comprá y vendé plumas, piedrería, trajes, armazones y zapatos de comparsa usados.",
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Feria del Comparsero",
    title: "Feria del Comparsero",
    description: "Plumas, piedrería, trajes, armazones y zapatos de comparsa usados. Todo en un solo lugar, con contacto directo por WhatsApp.",
    images: [{ url: "/brand/og-feria.jpg", width: 1200, height: 630, alt: "Plumas y brillos de carnaval" }],
  },
  twitter: { card: "summary_large_image" },
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
              "(function(){var r=document.documentElement,q=/[?&]intro/.test(location.search),s=null;try{if(q)sessionStorage.removeItem('feria-intro');s=sessionStorage.getItem('feria-intro')}catch(e){}r.classList.add('fx-on');if(s&&!q)r.classList.add('intro-off')})()",
          }}
        />
      </head>
      <body>
        {children}
        <ScrollFX />
        <SmoothScroll />
      </body>
    </html>
  );
}
