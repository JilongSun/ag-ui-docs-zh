import fs from "node:fs/promises";

export async function readText(file) {
  return fs.readFile(file, "utf8");
}

export function splitFrontmatter(text) {
  if (!text.startsWith("---\n")) return { frontmatter: null, body: text };
  const end = text.indexOf("\n---\n", 4);
  if (end === -1) return { frontmatter: null, body: text };
  return {
    frontmatter: text.slice(4, end),
    body: text.slice(end + 5),
  };
}

export function parseFrontmatterKeys(frontmatter) {
  if (!frontmatter) return [];
  return frontmatter
    .split("\n")
    .map((line) => line.match(/^([A-Za-z0-9_-]+):/)?.[1])
    .filter(Boolean);
}

/** Splits a markdown document into fence blocks and the remaining prose lines. */
export function splitFences(text) {
  const lines = text.split("\n");
  const blocks = [];
  const prose = [];
  let current = null;
  for (const line of lines) {
    if (current) {
      if (/^```\s*$/.test(line)) {
        blocks.push(current);
        current = null;
      } else {
        current.lines.push(line);
      }
      continue;
    }
    const open = line.match(/^```(\S*)\s*$/);
    if (open) {
      current = { info: open[1], lines: [] };
      continue;
    }
    prose.push(line);
  }
  if (current) blocks.push(current);
  return { blocks, prose };
}

export function headings(proseLines) {
  const out = [];
  for (const line of proseLines) {
    const m = line.match(/^(#{1,6})\s+(.*?)\s*$/);
    if (m) out.push({ level: m[1].length, text: m[2] });
  }
  return out;
}

export function tableRowCount(proseLines) {
  return proseLines.filter((line) => /^\s*\|/.test(line)).length;
}

export function countCallouts(proseLines, label) {
  const re = new RegExp(`^>\\s*\\[!${label}\\]`, "i");
  return proseLines.filter((line) => re.test(line.trim())).length;
}

export function countComponents(text, name) {
  return (text.match(new RegExp(`<${name}\\b`, "g")) || []).length;
}

export function cardHrefs(text) {
  return [...text.matchAll(/<Card\b[^>]*href="([^"]+)"/g)].map((m) => m[1]);
}

export function markdownLinks(text) {
  const out = [];
  const re = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let m;
  while ((m = re.exec(text))) out.push(m[1]);
  return out;
}

/** GitHub-style heading slug, with CJK kept. */
export function slugify(heading) {
  return heading
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/[*~]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function headingSlugs(markdown) {
  const { body } = splitFrontmatter(markdown);
  const { prose } = splitFences(body);
  return new Set(headings(prose).map((h) => slugify(h.text)));
}

/** Strips a trailing comment so only the code part is compared. */
export function codePart(line) {
  let quote = null;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quote) {
      if (ch === "\\") i += 1;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }
    if (line.startsWith("//", i)) return line.slice(0, i).trim();
    if (line.startsWith("/*", i)) return line.slice(0, i).trim();
    if (line.startsWith("<!--", i)) return line.slice(0, i).trim();
    if (ch === "#" && (i === 0 || /\s/.test(line[i - 1]))) return line.slice(0, i).trim();
  }
  const trimmed = line.trim();
  if (trimmed.startsWith("*") || trimmed.startsWith("*/")) return "";
  return trimmed;
}

export function isCommentLine(line) {
  const t = line.trim();
  return (
    t.startsWith("//") ||
    t.startsWith("#") ||
    t.startsWith("/*") ||
    t.startsWith("*") ||
    t.startsWith("<!--") ||
    t.startsWith("--") ||
    /^Note (over|left of|right of)\b/.test(t) ||
    t.startsWith("%%")
  );
}

export function relativeTarget(fromFile, toUpstreamPath) {
  // used by translations only in docs; kept here for completeness
  return toUpstreamPath;
}
