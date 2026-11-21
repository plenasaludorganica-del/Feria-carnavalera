import type { NextConfig } from "next";

const config: NextConfig = {
  images: {
    // En Cloudflare no usamos el optimizador de Next: las fotos ya se suben
    // achicadas (WebP 1600px + miniatura 480px) y las de marca están optimizadas.
    unoptimized: true,
  },
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
};

export default config;

// Permite usar las variables/bindings de Cloudflare en `npm run dev`
import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
