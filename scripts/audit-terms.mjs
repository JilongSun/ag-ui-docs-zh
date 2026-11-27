/**
 * 审计译文里「术语标注」的英文词是否真的出现在对应上游原文中。
 *
 * 为什么只查易混组：中文会把多个英文词收敛成同一个词，最典型的是
 * 「传输」同时对应 transport（传输层，协议概念）与 transfer / transmission
 * （普通的“数据传输”）；「流式」对应 stream 词族。这类标注错了会让读者
 * 误以为在讲传输层，而结构与代码校验都发现不了。
 *
 * 为什么不在整份文件里查：按标题切小节后逐节比对。标题的数量与顺序已由
 * check-parity 保证一致，是可靠锚点；小节级比对能容忍中英文段落合并。
 *
 * 为什么不做词形归一：做过一版，validation/validates、normative/normatively、
 * capability/capabilities 会大面积误报（实测 287 处），需要真正的英语词干化。
 * 这里只对容易混淆的词族做精确比对：同族内任一词形算通过，跨族不算。
 *
 * 非阻断：默认退出码 0，只输出清单供人工确认。扩展方式是在 FAMILY 里加一组。
 */
import fs from "node:fs";
import path from "node:path";

const CONTENT_DIR = "content/zh";
const CACHE_DIR = ".cache/upstream";

const FAMILY = {
  transport: ["transport", "transports"],
  stream: ["stream", "streams", "streaming", "streamed", "streamable"],
  transfer: ["transfer", "transfers", "transferred", "transmission", "transmitted", "transmit"],
  wire: ["wire", "wires"],
};

/** 单词的常见词形，用于多词标注逐词核对。 */
function wordForms(word) {
  const forms = [word, `${word}s`];
  if (word.endsWith("y")) forms.push(`${word.slice(0, -1)}ies`);
  if (/(s|x|z|ch|sh)$/.test(word)) forms.push(`${word}es`);
  return forms;
}

const wordRegex = (word) =>
  new RegExp(`(?<![a-z])(?:${wordForms(word).map(escapeRegex).join("|")})(?![a-z])`, "i");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const familyOf = (term) =>
  Object.entries(FAMILY).find(([, forms]) => forms.includes(term))?.[0] ?? null;

const familyRegex = (family) =>
  new RegExp(`(?<![a-z])(?:${FAMILY[family].join("|")})(?![a-z])`, "i");

function sections(markdown) {
  // 正文第一行的文件行号：frontmatter 行数 + 1
  const cut = markdown.startsWith("---\n") ? markdown.indexOf("\n---\n") + 5 : 0;
  const baseLine = markdown.slice(0, cut).split("\n").length;
  const lines = markdown.slice(cut).split("\n");
  const out = [{ heading: "(开头)", text: [], annotations: [] }];
  let fence = false;
  lines.forEach((line, index) => {
    if (/^\s*```/.test(line)) {
      fence = !fence;
      return;
    }
    if (fence) return;
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    if (heading) {
      out.push({ heading: heading[1].trim(), text: [], annotations: [], line: index + 1 });
      return;
    }
    const current = out[out.length - 1];
    current.text.push(line);
    for (const match of line.matchAll(/（([a-z][a-zA-Z .\-']*)）/g)) {
      const term = match[1].trim().toLowerCase();
      current.annotations.push({ term, family: familyOf(term), line: baseLine + index });
    }
  });
  for (const section of out) section.plain = section.text.join(" ");
  return out;
}

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.name.endsWith(".md")) files.push(full);
  }
  return files.sort();
}

const problems = [];
let checked = 0;

for (const file of walk(CONTENT_DIR)) {
  const upstream = path.join(CACHE_DIR, "docs", `${path.relative(CONTENT_DIR, file).replace(/\.md$/, ".mdx")}`);
  if (!fs.existsSync(upstream)) continue;

  const translated = sections(fs.readFileSync(file, "utf8"));
  const original = sections(fs.readFileSync(upstream, "utf8"));
  const rel = file.split(path.sep).join("/");

  if (translated.length !== original.length) {
    problems.push(`${rel}: 小节数 ${translated.length} != 上游 ${original.length}，无法逐节比对`);
    continue;
  }

  translated.forEach((section, index) => {
    const source = original[index].plain;
    for (const { term, family, line } of section.annotations) {
      const heading = original[index].heading;
      if (family) {
        checked += 1;
        if (!familyRegex(family).test(source)) {
          problems.push(`${rel}:${line} 「${term}」未在原文小节「${heading}」出现`);
        }
        continue;
      }
      if (!term.includes(" ")) continue;
      checked += 1;
      const missing = term.split(/[\s-]+/).filter(Boolean).filter((word) => !wordRegex(word).test(source));
      if (missing.length) {
        problems.push(
          `${rel}:${line} 「${term}」的 ${missing.map((w) => `\`${w}\``).join("、")} 未在原文小节「${heading}」出现`,
        );
      }
    }
  });
}

if (problems.length) {
  console.log(`audit-terms: ${problems.length} 处可疑标注（共比对 ${checked} 处）\n`);
  for (const problem of problems) console.log(`  - ${problem}`);
  console.log("\n请逐条对照原文：标注的英文词必须真的出现在对应小节里，否则改用原文的实际用词，或去掉标注。");
} else {
  console.log(`audit-terms: ${checked} 处术语标注均与原文一致。`);
}
