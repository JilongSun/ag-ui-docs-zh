/**
 * 审计内联标注「中文（原文）」是否合规。只报告，不阻断。
 *
 * 三条规则：
 *  1. 英文部分必须来自受控词表（scripts/annotations.mjs，与 glossary.md 的白名单同源）。
 *  2. 正文里同一个词只标一次（标题与 frontmatter 不占配额）。
 *  3. 该词必须真的出现在对应的上游文本里——这是为了拦住"从中文反查术语表贴上去"
 *     的做法：中文把 transport / transfer / transmission 都译作「传输」，看到「传输」
 *     就去查表，必然会在只写 transfer 的句子上标出 transport。
 *
 * 第 3 条按小节比对（正文）或整篇比对（frontmatter、标题）：标题的数量与顺序由
 * check-parity 保证一致，是可靠锚点；小节级比对能容忍中英文段落合并。
 */
import fs from "node:fs";
import path from "node:path";
import { CONTENT_DIR, cachedUpstreamPath, contentToUpstream } from "./config.mjs";
import { ANNOTATION_ALLOWLIST, termAppears } from "./annotations.mjs";

const ALLOWED = new Set(ANNOTATION_ALLOWLIST);
const ANNOTATION = /（([a-z][a-zA-Z .\-']*)）/g;

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.name.endsWith(".md")) files.push(full);
  }
  return files.sort();
}

/** 每一行归属的小节文本；frontmatter 与标题返回 null（改用整篇比对）。 */
function sectionTextAt(markdown) {
  const lines = markdown.split("\n");
  const frontmatterEnd = markdown.startsWith("---\n")
    ? lines.findIndex((line, index) => index > 0 && line.trim() === "---")
    : -1;

  const sectionStarts = [];
  let fence = false;
  lines.forEach((line, index) => {
    if (/^\s*```/.test(line)) {
      fence = !fence;
      return;
    }
    if (fence) return;
    if (/^#{1,6}\s+/.test(line)) sectionStarts.push(index);
  });

  const sectionTexts = sectionStarts.map((start, i) => {
    const end = i + 1 < sectionStarts.length ? sectionStarts[i + 1] : lines.length;
    return lines.slice(start + 1, end).join(" ");
  });

  /** lineNumber 为 1 基 */
  return (lineNumber) => {
    const index = lineNumber - 1;
    if (index <= frontmatterEnd) return null;
    if (/^#{1,6}\s+/.test(lines[index])) return null;
    let sectionIndex = -1;
    for (let i = 0; i < sectionStarts.length; i += 1) {
      if (sectionStarts[i] < index) sectionIndex = i;
      else break;
    }
    if (sectionIndex === -1) return null;
    return { heading: lines[sectionStarts[sectionIndex]].trim(), text: sectionTexts[sectionIndex] };
  };
}

/** glossary.md 的「标注白名单」必须与代码里的受控词表一致。 */
function glossaryAllowlist() {
  const text = fs.readFileSync("glossary.md", "utf8");
  const start = text.indexOf("## 标注白名单");
  if (start === -1) return null;
  const end = text.indexOf("\n## ", start + 1);
  const block = text.slice(start, end === -1 ? undefined : end);
  const rows = block.split("\n").filter((line) => line.trimStart().startsWith("|"));
  return new Set([...rows.join("\n").matchAll(/`([a-z][a-z .\-']*)`/g)].map((m) => m[1].trim()));
}

const problems = [];

const documented = glossaryAllowlist();
if (!documented) {
  problems.push("glossary.md 找不到「标注白名单」小节");
} else {
  for (const term of ALLOWED) if (!documented.has(term)) problems.push(`glossary.md 白名单缺 \`${term}\``);
  for (const term of documented) if (!ALLOWED.has(term)) problems.push(`glossary.md 白名单多出 \`${term}\``);
}

let checked = 0;

for (const file of walk(CONTENT_DIR)) {
  const rel = file.split(path.sep).join("/");
  const markdown = fs.readFileSync(file, "utf8");
  const upstreamPath = cachedUpstreamPath(contentToUpstream(file));
  const hasUpstream = fs.existsSync(upstreamPath);
  const wholeUpstream = hasUpstream ? fs.readFileSync(upstreamPath, "utf8") : "";
  const locate = sectionTextAt(markdown);

  const frontmatterEnd = markdown.startsWith("---\n")
    ? markdown.split("\n").findIndex((line, index) => index > 0 && line.trim() === "---")
    : -1;
  const proseSeen = new Map();
  markdown.split("\n").forEach((line, index) => {
    const structural = index <= frontmatterEnd || /^#{1,6}\s+/.test(line);
    for (const match of line.matchAll(ANNOTATION)) {
      const term = match[1].trim().toLowerCase();
      const lineNumber = index + 1;
      checked += 1;

      if (!ALLOWED.has(term)) {
        problems.push(`${rel}:${lineNumber} 「${term}」不在受控词表内`);
        continue;
      }
      // 标题与 frontmatter 不占配额：那里本来就该带标注
      if (!structural) {
        if (proseSeen.has(term)) {
          problems.push(`${rel}:${lineNumber} 「${term}」重复标注（正文首次在第 ${proseSeen.get(term)} 行）`);
          continue;
        }
        proseSeen.set(term, lineNumber);
      }

      if (!hasUpstream) continue;
      const section = locate(lineNumber);
      if (!section) {
        if (!termAppears(term, wholeUpstream)) {
          problems.push(`${rel}:${lineNumber} 「${term}」未在原文出现`);
        }
        continue;
      }
      if (!termAppears(term, section.text)) {
        problems.push(`${rel}:${lineNumber} 「${term}」未在原文小节「${section.heading}」出现`);
      }
    }
  });
}

if (problems.length) {
  console.log(`audit-terms: ${problems.length} 处问题（共检查 ${checked} 处标注）\n`);
  for (const problem of problems) console.log(`  - ${problem}`);
  console.log("\n标注只能从当前原文里取词。若原文用的是另一个词，改用那个词或不加标注。");
} else {
  console.log(`audit-terms: ${checked} 处标注合规（受控词表、每页一次、原文可证）。`);
}
