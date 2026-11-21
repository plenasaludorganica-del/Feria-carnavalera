import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig({});

export default {
  ...config,
  // `npm run build` ahora arma la versión para Cloudflare; adentro, Next se
  // compila con este comando (evita que OpenNext se llame a sí mismo).
  buildCommand: "npx next build",
};
