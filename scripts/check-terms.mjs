import fs from "node:fs/promises";
import path from "node:path";
import { CONTENT_DIR, cachedUpstreamPath, contentToUpstream } from "./config.mjs";
import { readText, splitFrontmatter } from "./lib.mjs";

const FORBIDDEN = [
  [/智能体/, "Agent 不译，子 Agent 写作「子 Agent（subagent）」"],
  [/串流/, "stream 译作「流（stream）」"],
  [/讯息/, "message 译作「消息（message）」"],
  [/schema（schema）/, "不译词不加原文标注"],
  [/JSON Patch（JSON Patch）/, "不译词不加原文标注"],
];

const LEFTOVER_COMPONENTS = /<(Note|Warning|Tip|Card|CardGroup|Frame|Tabs|Tab|CodeGroup|Accordion|AccordionGroup|Steps|Step|Columns|Column)\b/;

// 译文是纯 Markdown，任何 JSX 都渲染不出来：站点特有的内联样式徽章、属性表达式等。
const LEFTOVER_JSX = [
  [/<(span|div|br|p|a|strong|em|code|img)\b(?=[^>]*(?:style=|className=))/i, "JSX 元素"],
  [/\bstyle=\{\{/, "JSX 内联样式"],
  [/\bclassName=/, "JSX className"],
  [/\{\/\*/, "MDX 注释"],
];

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
const problems = [];

for (const file of files) {
  const text = await readText(file);
  const { body } = splitFrontmatter(text);
  const lines = body.split("\n");

  for (const [pattern, hint] of FORBIDDEN) {
    if (pattern.test(body)) {
      const lineNo = lines.findIndex((line) => pattern.test(line)) + 1;
      problems.push(`${file}:${lineNo}: forbidden wording ${pattern} — ${hint}`);
    }
  }

  lines.forEach((line, index) => {
    if (LEFTOVER_COMPONENTS.test(line)) {
      problems.push(`${file}:${index + 1}: untranslated Mintlify component ${line.trim().slice(0, 40)}`);
    }
    for (const [pattern, label] of LEFTOVER_JSX) {
      if (pattern.test(line)) {
        problems.push(`${file}:${index + 1}: 残留 ${label}，纯 Markdown 无法渲染 — ${line.trim().slice(0, 60)}`);
        break;
      }
    }
    for (const code of line.matchAll(/`([^`]+)`/g)) {
      if (/[\u4e00-\u9fff]/.test(code[1])) {
        problems.push(`${file}:${index + 1}: Chinese inside inline code \`${code[1]}\``);
      }
    }
  });

  // Protocol identifiers are never translated: every SCREAMING_SNAKE token upstream must survive.
  try {
    const source = await readText(cachedUpstreamPath(contentToUpstream(file)));
    const identifiers = new Set(source.match(/\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g) || []);
    for (const id of identifiers) {
      if (!text.includes(id)) problems.push(`${file}: protocol identifier ${id} missing`);
    }
  } catch {
    problems.push(`${file}: no cached upstream file — run: node scripts/fetch-upstream.mjs`);
  }
}

if (problems.length) {
  console.error(`check-terms: ${problems.length} problem(s)\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`check-terms: ${files.length} file(s) OK.`);
