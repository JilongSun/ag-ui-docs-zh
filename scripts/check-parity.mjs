import fs from "node:fs/promises";
import path from "node:path";
import {
  CALLOUTS, CONTENT_DIR, cachedUpstreamPath, contentToUpstream,
} from "./config.mjs";
import {
  cardHrefs, codePart, countCallouts, countComponents, headings, markdownLinks,
  parseFrontmatterKeys, readText, splitFences, splitFrontmatter, tableRowCount,
} from "./lib.mjs";

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

function resolveTarget(fromFile, target) {
  const clean = target.split("#")[0];
  if (!clean) return null;
  const abs = path.resolve(path.dirname(fromFile), clean);
  return path.relative(process.cwd(), abs).split(path.sep).join("/");
}

const files = await walk(CONTENT_DIR);
const problems = [];
const fail = (file, message) => problems.push(`${file}: ${message}`);

for (const file of files) {
  const upstreamPath = contentToUpstream(file);
  let source;
  try {
    source = await readText(cachedUpstreamPath(upstreamPath));
  } catch {
    fail(file, `no cached upstream file for ${upstreamPath} — run: node scripts/fetch-upstream.mjs`);
    continue;
  }

  const translation = await readText(file);
  const src = splitFrontmatter(source);
  const tr = splitFrontmatter(translation);

  const srcKeys = parseFrontmatterKeys(src.frontmatter);
  const trKeys = parseFrontmatterKeys(tr.frontmatter);
  if (trKeys.join(",") !== "title,description") {
    fail(file, `frontmatter must have exactly title, description (found: ${trKeys.join(", ") || "none"})`);
  } else if (srcKeys.length && srcKeys.join(",") !== "title,description") {
    fail(file, `upstream frontmatter keys changed: ${srcKeys.join(", ")}`);
  }

  const srcFences = splitFences(src.body);
  const trFences = splitFences(tr.body);

  const srcHeadings = headings(srcFences.prose);
  const trHeadings = headings(trFences.prose);
  if (srcHeadings.length !== trHeadings.length) {
    fail(file, `heading count ${trHeadings.length} != upstream ${srcHeadings.length}`);
  } else {
    for (let i = 0; i < srcHeadings.length; i += 1) {
      if (srcHeadings[i].level !== trHeadings[i].level) {
        fail(file, `heading #${i + 1} level h${trHeadings[i].level} != upstream h${srcHeadings[i].level}`);
        break;
      }
    }
  }

  if (srcFences.blocks.length !== trFences.blocks.length) {
    fail(file, `code fence count ${trFences.blocks.length} != upstream ${srcFences.blocks.length}`);
  } else {
    for (let i = 0; i < srcFences.blocks.length; i += 1) {
      const a = srcFences.blocks[i];
      const b = trFences.blocks[i];
      if (a.info !== b.info) fail(file, `fence #${i + 1} language "${b.info}" != upstream "${a.info}"`);
      if (a.lines.length !== b.lines.length) {
        fail(file, `fence #${i + 1} has ${b.lines.length} lines, upstream ${a.lines.length}`);
        continue;
      }
      if (a.info === "mermaid") continue;
      for (let j = 0; j < a.lines.length; j += 1) {
        const srcLine = a.lines[j].replace(/\s+$/, "");
        const trLine = b.lines[j].replace(/\s+$/, "");
        if (srcLine === trLine) continue;
        if (codePart(srcLine) === codePart(trLine)) continue;
        fail(file, `fence #${i + 1} line ${j + 1} changed code: "${trLine}" (upstream "${srcLine}")`);
        break;
      }
    }
  }

  const srcRows = tableRowCount(srcFences.prose);
  const trRows = tableRowCount(trFences.prose);
  if (srcRows !== trRows) fail(file, `table rows ${trRows} != upstream ${srcRows}`);

  for (const [component, label] of Object.entries(CALLOUTS)) {
    const expected = countComponents(source, component);
    const actual = countCallouts(trFences.prose, label.slice(2, -1));
    if (expected !== actual) {
      fail(file, `${component} blocks: translation has ${actual} "${label}", upstream has ${expected}`);
    }
  }

  const links = markdownLinks(tr.body);
  for (const href of cardHrefs(source)) {
    const asAbsolute = `https://docs.ag-ui.com${href}`;
    const clean = href.split("#")[0].replace(/^\//, "").replace(/\/$/, "");
    const candidates = href.split("#")[0].endsWith(".json")
      ? []
      : [`content/zh/${clean}.md`, `content/zh/${clean}/index.md`];
    const found = links.some((link) => {
      if (link === asAbsolute) return true;
      const resolved = resolveTarget(file, link);
      return candidates.includes(resolved);
    });
    if (!found) fail(file, `card link ${href} missing from translation`);
  }
}

if (problems.length) {
  console.error(`check-parity: ${problems.length} problem(s)\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`check-parity: ${files.length} file(s) OK.`);
