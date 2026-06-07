/**
 * TRD §13.2 — sum PNG bytes under `public/` (default cap 2MB).
 * Run in CI or before release: `node scripts/check-ambient-png-budget.mjs`
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "..", "public");
const MAX_BYTES = Number(process.env.AMBIENT_PNG_BUDGET_BYTES ?? 2_000_000);

function walkPng(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walkPng(p, acc);
    else if (name.isFile() && name.name.toLowerCase().endsWith(".png")) acc.push(p);
  }
  return acc;
}

const files = walkPng(PUBLIC);
let total = 0;
for (const f of files) {
  total += fs.statSync(f).size;
}

const mb = (total / 1_000_000).toFixed(3);
console.log(`PNG total under public/: ${total} bytes (${mb} MB) across ${files.length} file(s). Cap: ${MAX_BYTES} bytes.`);

if (total > MAX_BYTES) {
  console.error(`Budget exceeded (${total} > ${MAX_BYTES}).`);
  process.exit(1);
}
