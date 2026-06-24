/**
 * Generates PWA icons from brand tokens. Run: node scripts/generate-pwa-icons.mjs
 * Requires sharp (devDependency).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../public/icons");
/** Keep in sync with src/shared/pwa/config.ts PWA_THEME_COLOR */
const BRAND_PURPLE = "#7C3AED";
const SIZES = [192, 512, 180];

function iconSvg(size) {
  const radius = Math.round(size * 0.22);
  const fontSize = Math.round(size * 0.36);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${BRAND_PURPLE}"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="system-ui,Segoe UI,sans-serif" font-weight="700" font-size="${fontSize}">YO</text>
</svg>`);
}

async function writePng(size, filename) {
  const png = await sharp(iconSvg(size)).png().toBuffer();
  await writeFile(join(OUT_DIR, filename), png);
}

await mkdir(OUT_DIR, { recursive: true });
await Promise.all([
  writePng(192, "icon-192.png"),
  writePng(512, "icon-512.png"),
  writePng(180, "apple-touch-icon.png"),
]);
console.log("Wrote PWA icons to public/icons/");