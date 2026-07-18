#!/usr/bin/env node
/**
 * Day 11 — key parity check for next-intl message catalogs.
 * Compares ne.json / fi.json against en.json (source of truth) per app.
 * Exit 1 on missing keys so CI / `pnpm i18n:check` fails on drift.
 *
 * Usage:
 *   node scripts/i18n-check.mjs
 *   node scripts/i18n-check.mjs --list   # print every missing key
 */

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const APPS = ["customer", "merchant", "admin"];
const LOCALES = ["ne", "fi"];
const listAll = process.argv.includes("--list");

function flatten(obj, prefix = "") {
  /** @type {string[]} */
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...flatten(v, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

let failed = false;
let totalMissing = 0;

for (const app of APPS) {
  const dir = join(ROOT, "apps", app, "messages");
  const enPath = join(dir, "en.json");
  if (!existsSync(enPath)) {
    console.error(`FAIL  ${app}: missing en.json`);
    failed = true;
    continue;
  }

  const enKeys = new Set(flatten(loadJson(enPath)));
  console.log(`\n${app}  (en: ${enKeys.size} keys)`);

  for (const locale of LOCALES) {
    const localePath = join(dir, `${locale}.json`);
    if (!existsSync(localePath)) {
      console.error(`  FAIL  ${locale}.json — file missing (${enKeys.size} keys needed)`);
      failed = true;
      totalMissing += enKeys.size;
      continue;
    }

    const localeKeys = new Set(flatten(loadJson(localePath)));
    const missing = [...enKeys].filter((k) => !localeKeys.has(k)).sort();
    const extra = [...localeKeys].filter((k) => !enKeys.has(k)).sort();

    if (missing.length === 0 && extra.length === 0) {
      console.log(`  OK    ${locale}.json — ${localeKeys.size} keys`);
      continue;
    }

    failed = true;
    totalMissing += missing.length;

    const byNs = {};
    for (const k of missing) {
      const ns = k.split(".")[0];
      byNs[ns] = (byNs[ns] || 0) + 1;
    }

    console.error(
      `  FAIL  ${locale}.json — missing ${missing.length}, extra ${extra.length}`,
    );
    console.error(`         by namespace: ${JSON.stringify(byNs)}`);

    if (listAll) {
      for (const k of missing) console.error(`         - ${k}`);
      for (const k of extra) console.error(`         + ${k} (extra)`);
    } else if (missing.length > 0) {
      const sample = missing.slice(0, 12);
      console.error(
        `         sample: ${sample.join(", ")}${missing.length > 12 ? "…" : ""}`,
      );
      console.error(`         (re-run with --list for full missing key list)`);
    }
  }
}

// Sanity: ensure message dirs only contain expected locale files
for (const app of APPS) {
  const dir = join(ROOT, "apps", app, "messages");
  if (!existsSync(dir)) continue;
  const unexpected = readdirSync(dir).filter(
    (f) => f.endsWith(".json") && !["en.json", "ne.json", "fi.json"].includes(f),
  );
  if (unexpected.length) {
    console.warn(`\nWARN  ${app}: unexpected message files: ${unexpected.join(", ")}`);
  }
}

console.log("");
if (failed) {
  console.error(
    `i18n:check failed — ${totalMissing} missing key(s) across apps/locales.`,
  );
  process.exit(1);
}

console.log("i18n:check passed — en / ne / fi key parity for all apps.");
