// Convierte las imágenes fuente (Higgsfield) a WebP livianas para la web.
// Uso: node scripts/optimize-images.mjs <carpeta-origen>
import sharp from "sharp";
import { readdir } from "node:fs/promises";
import path from "node:path";

const src = process.argv[2];
const map = {
  "1.jpg": ["fondo-plumas-brillos", 1600],
  "2.jpg": ["comparsera", 900],
  "3.jpg": ["comparsero", 900],
  "4.jpg": ["plumas", 900],
  "5.jpg": ["coronas-piedreria", 900],
};
for (const f of await readdir(src)) {
  if (!map[f]) continue;
  const [name, w] = map[f];
  await sharp(path.join(src, f)).resize({ width: w, withoutEnlargement: true })
    .webp({ quality: 72 }).toFile(`public/brand/${name}.webp`);
  console.log("ok", name);
}
