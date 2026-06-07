/**
 * Optional lossy PNG recompression under public/ (Phase 13).
 * Default: --dry-run. Use --apply to overwrite (back up first).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "public");
const DRY = !process.argv.includes("--apply");

function walkPng(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkPng(p, acc);
    else if (ent.isFile() && ent.name.toLowerCase().endsWith(".png")) acc.push(p);
  }
  return acc;
}

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("Install sharp: npm i -D sharp");
  process.exit(1);
}

const files = walkPng(ROOT);
let saved = 0;
for (const f of files) {
  const before = fs.statSync(f).size;
  const buf = await sharp(f).png({ compressionLevel: 9, effort: 10 }).toBuffer();
  const after = buf.length;
  const delta = before - after;
  saved += Math.max(0, delta);
  const rel = path.relative(path.join(__dirname, ".."), f);
  if (DRY) {
    console.log(`${rel}: ${before} → ${after} bytes (${delta >= 0 ? "-" : "+"}${Math.abs(delta)})`);
  } else {
    fs.writeFileSync(f, buf);
    console.log(`${rel}: wrote ${after} bytes (was ${before})`);
  }
}

console.log(
  DRY
    ? `\nDry run. Total potential savings: ~${saved} bytes. Re-run with --apply to write.`
    : `\nApplied. Total bytes reduced by ~${saved} (vs previous files).`,
);
