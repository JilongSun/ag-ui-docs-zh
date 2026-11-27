/**
 * 内联标注的受控词表。
 *
 * 译文里「中文（原文）」的英文部分只允许取自这里。理由见 TRANSLATING.md：
 * 中文把多个英文词收敛成同一个词（传输 ← transport / transfer / transmission），
 * 靠中文反查术语表必然贴错，所以标注必须从当前这句原文里取词，而这里定义
 * 哪些词值得标、以什么形式标。
 *
 * 新增词条前先确认：它在整套文档里中英是一对一的，不会引出「这个词到底是
 * wire 还是 wire format」这类歧义。
 */
export const ANNOTATION_ALLOWLIST = [
  "subagent",
  "run",
  "run input",
  "thread",
  "message",
  "event",
  "event family",
  "tool call",
  "tool result",
  "state",
  "snapshot",
  "delta",
  "interrupt",
  "resume",
  "reasoning",
  "activity",
  "metadata",
  "capability",
  "transport",
  "binding",
  "producer",
  "consumer",
  "client",
  "server",
  "middleware",
  "frontend",
  "wire",
  "required",
  "optional",
  "normative",
  "conformance",
  "deprecated",
];

const DOUBLE = /[^aeiou][aeiou][bdgklmnprstvz]$/;

/** 同根但词形跨度大的词，显式列出，避免误报。 */
const ROOT_FORMS = {
  conformance: ["conform", "conforms", "conformed", "conforming", "conformant"],
  binding: ["bind", "binds", "bound", "binding"],
  resume: ["resume", "resumes", "resumed", "resuming"],
  deprecated: ["deprecate", "deprecates", "deprecated", "deprecating", "deprecation"],
  required: ["require", "requires", "required", "requiring", "requirement", "requirements"],
  capability: ["capability", "capabilities"],
  normative: ["normative", "normatively"],
  wire: ["wire", "wires", "wired"],
};

/** 一个词条在上游原文里可能出现的词形，用于逐条核对。 */
export function wordForms(term) {
  const words = term.split(/[\s-]+/).filter(Boolean);
  const forms = new Set();
  const push = (word) => {
    const list = [word, `${word}s`, `${word}ed`, `${word}ing`, `${word}ly`];
    if (word.endsWith("y")) list.push(`${word.slice(0, -1)}ies`);
    if (word.endsWith("e")) list.push(`${word.slice(0, -1)}ing`, `${word.slice(0, -1)}ed`);
    if (DOUBLE.test(word)) list.push(`${word}${word.at(-1)}ing`, `${word}${word.at(-1)}ed`);
    for (const form of list) forms.add(form);
  };
  if (words.length === 1) push(words[0]);
  // 多词短语按原文的写法整体匹配，同时容忍连字符与空格互换
  forms.add(term);
  for (const extra of ROOT_FORMS[term] ?? []) forms.add(extra);
  return [...forms];
}

export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** 词条在上游文本里是否出现（词形与连字符/空格都容忍）。 */
export function termAppears(term, text) {
  const alternatives = wordForms(term).map(escapeRegex);
  const pattern = term.includes(" ")
    ? new RegExp(`(?<![a-z])(?:${alternatives.join("|")})`, "i")
    : new RegExp(`(?<![a-z])(?:${alternatives.join("|")})(?![a-z])`, "i");
  // 多词短语允许连字符与空格互换，末词允许复数
  if (term.includes(" ")) {
    const words = term.split(/[\s-]+/);
    const last = words.pop();
    const lastForms = [last, `${last}s`];
    if (last.endsWith("y")) lastForms.push(`${last.slice(0, -1)}ies`);
    if (/(s|x|z|ch|sh)$/.test(last)) lastForms.push(`${last}es`);
    const head = words.map(escapeRegex).join("[-\\s]");
    const pattern2 = `(?<![a-z])${head}[-\\s](?:${lastForms.map(escapeRegex).join("|")})(?![a-z])`;
    if (new RegExp(pattern2, "i").test(text)) return true;
  }
  return pattern.test(text);
}
