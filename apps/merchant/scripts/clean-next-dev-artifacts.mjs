import { rmSync } from "node:fs";
import { join } from "node:path";

/** Dev-only Next artifacts; stale/corrupt files break Turbopack route discovery. */
rmSync(join(import.meta.dirname, "..", ".next", "dev"), {
  recursive: true,
  force: true,
});
