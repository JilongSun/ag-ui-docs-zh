import fs from "node:fs/promises";
import path from "node:path";
import { CONTENT_DIR } from "./config.mjs";
import { headingSlugs, markdownLinks, readText, splitFences, splitFrontmatter } from "./lib.mjs";

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.name.endsWith(".md")) files.push(full);
  }
  return files.sort();
}

const files = await walk(CONTENT_DIR);
const slugs = new Map();
const problems = [];

for (const file of files) {
  slugs.set(file, headingSlugs(await readText(file)));
}

for (const file of files) {
  const text = await readText(file);
  for (const rawTarget of markdownLinks(text)) {
    const target = rawTarget.replace(/^<|>$/g, "");
    if (/^(https?:|mailto:)/.test(target)) continue;
    if (target.startsWith("#")) {
      const anchor = decodeURIComponent(target.slice(1));
      if (anchor && !slugs.get(file)?.has(anchor)) {
        problems.push(`${file}: in-page anchor "${target}" not found`);
      }
      continue;
    }
    if (target.startsWith("/")) {
      problems.push(`${file}: absolute site path "${target}" must be rewritten to a relative link or a docs.ag-ui.com URL`);
      continue;
    }
    const [pathPart, anchor] = target.split("#");
    const resolved = path
      .relative(process.cwd(), path.resolve(path.dirname(file), pathPart))
      .split(path.sep)
      .join("/");
    if (!resolved.startsWith(`${CONTENT_DIR}/`)) {
      problems.push(`${file}: link "${target}" escapes ${CONTENT_DIR}/`);
      continue;
    }
    try {
      await fs.access(resolved);
    } catch {
      problems.push(`${file}: link "${target}" -> ${resolved} does not exist`);
      continue;
    }
    if (anchor) {
      const targetSlugs = slugs.get(resolved);
      if (!targetSlugs) {
        problems.push(`${file}: link "${target}" points at a non-markdown target`);
      } else if (!targetSlugs.has(decodeURIComponent(anchor))) {
        problems.push(`${file}: anchor "#${anchor}" not found in ${resolved}`);
      }
    }
  }
}

if (problems.length) {
  console.error(`check-links: ${problems.length} problem(s)\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`check-links: ${files.length} file(s) OK.`);
