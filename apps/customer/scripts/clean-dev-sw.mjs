import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const publicDir = join(import.meta.dirname, "..", "public");

for (const name of readdirSync(publicDir)) {
  if (
    name === "sw.js" ||
    name === "sw.js.map" ||
    name.startsWith("workbox-") ||
    name.startsWith("worker-")
  ) {
    rmSync(join(publicDir, name), { force: true });
  }
}
