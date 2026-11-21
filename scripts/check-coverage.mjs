import fs from "node:fs/promises";
import path from "node:path";
import { CONTENT_DIR, LOCK_FILE, isInScope, upstreamToContent } from "./config.mjs";

const lock = JSON.parse(await fs.readFile(LOCK_FILE, "utf8"));
const upstreamPaths = Object.keys(lock.files).filter(isInScope);
const missing = [];
const translated = [];

for (const upstreamPath of upstreamPaths) {
  const contentPath = upstreamToContent(upstreamPath);
  try {
    await fs.access(contentPath);
    translated.push(contentPath);
  } catch {
    missing.push(`${upstreamPath} -> ${contentPath}`);
  }
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.name.endsWith(".md")) files.push(full.split(path.sep).join("/"));
  }
  return files;
}

const known = new Set(upstreamPaths.map(upstreamToContent));
const orphaned = (await walk(CONTENT_DIR)).filter((file) => !known.has(file));

if (missing.length || orphaned.length) {
  if (missing.length) {
    console.error(`check-coverage: ${missing.length} upstream file(s) not translated:`);
    for (const item of missing) console.error(`  - ${item}`);
  }
  if (orphaned.length) {
    console.error(`check-coverage: ${orphaned.length} translated file(s) with no upstream counterpart:`);
    for (const item of orphaned) console.error(`  - ${item}`);
  }
  process.exit(1);
}

console.log(`check-coverage: ${translated.length}/${upstreamPaths.length} upstream files translated.`);
