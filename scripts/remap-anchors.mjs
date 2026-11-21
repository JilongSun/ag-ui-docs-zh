import fs from "node:fs/promises";
import path from "node:path";
import { CONTENT_DIR, cachedUpstreamPath, contentToUpstream } from "./config.mjs";
import { headings, readText, slugify, splitFences, splitFrontmatter } from "./lib.mjs";

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.name.endsWith(".md")) files.push(full.split(path.sep).join("/"));
  }
  return files.sort();
}

function headingTexts(markdown) {
  return headings(splitFences(splitFrontmatter(markdown).body).prose).map((h) => h.text);
}

const files = await walk(CONTENT_DIR);
const maps = new Map();

for (const file of files) {
  try {
    const [upstreamMarkdown, translationMarkdown] = await Promise.all([
      readText(cachedUpstreamPath(contentToUpstream(file))),
      readText(file),
    ]);
    const upstreamSlugs = headingTexts(upstreamMarkdown).map(slugify);
    const translatedSlugs = headingTexts(translationMarkdown).map(slugify);
    const map = new Map();
    upstreamSlugs.forEach((slug, index) => {
      if (index < translatedSlugs.length && !map.has(slug)) map.set(slug, translatedSlugs[index]);
    });
    maps.set(file, map);
  } catch {
    maps.set(file, new Map());
  }
}

const changed = [];

for (const file of files) {
  const original = await readText(file);
  const updated = original.replace(/\]\(([^)\s]+)\)/g, (whole, target) => {
    if (/^(https?:|mailto:)/.test(target)) return whole;
    if (target.startsWith("#")) {
      const mapped = maps.get(file)?.get(target.slice(1));
      return mapped ? `](#${mapped})` : whole;
    }
    if (!target.includes("#")) return whole;
    const [pathPart, anchor] = target.split("#");
    const dest = path
      .relative(process.cwd(), path.resolve(path.dirname(file), pathPart))
      .split(path.sep)
      .join("/");
    const mapped = maps.get(dest)?.get(anchor);
    return mapped && mapped !== anchor ? `](${pathPart}#${mapped})` : whole;
  });
  if (updated !== original) {
    await fs.writeFile(file, updated);
    changed.push(file);
  }
}

console.log(`remap-anchors: ${changed.length} file(s) updated.`);
for (const file of changed) console.log(`  - ${file}`);
