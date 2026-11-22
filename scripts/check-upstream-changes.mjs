#!/usr/bin/env node
/**
 * 对比基线快照与上游当前状态，生成待处理报告。
 *
 * 判定（取最高者）：
 *   spec-release  出现比锁文件更新的大/小版本 tag（ag-ui-protocol@X.Y.Z）
 *   spec          已冻结规范 docs/spec/1.0/** 有增删改
 *   concepts      docs/concepts/** 有增删改
 *   draft         仅 docs/spec/draft/** 与导航变化，不翻译，不触发通知
 *   none          范围内无变化
 *
 * 用法：
 *   node scripts/check-upstream-changes.mjs                       # CI：锁文件基线 vs 上游 main
 *   node scripts/check-upstream-changes.mjs --since <sha>          # 只报该提交之后的变化
 *   node scripts/check-upstream-changes.mjs --local-repo ../ag-ui  # 本地预演，对比 clone 的 HEAD
 *   node scripts/check-upstream-changes.mjs --local-repo ../ag-ui --head origin/main  # 对比上游主干
 *   node scripts/check-upstream-changes.mjs --base <sha> --head <sha> --local-repo ../ag-ui
 *
 * 输出：sync-report.md，以及 $GITHUB_OUTPUT 的 severity / has_changes / headline / head_sha。
 */
import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { LOCK_FILE, UPSTREAM_OWNER, UPSTREAM_REPO } from "./config.mjs";

const argv = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};

const localRepo = arg("local-repo");
const REPORT = arg("report", "sync-report.md");
const DOCS_JSON = "docs/docs.json";
const WATCHED_PREFIXES = ["docs/concepts/", "docs/spec/"];
const PROTOCOL_TAG = /^ag-ui-protocol@(\d+)\.(\d+)\.(\d+)$/;

const lock = JSON.parse(await fs.readFile(LOCK_FILE, "utf8"));
const since = arg("since");
const base = arg("base", since || lock.sha);
const head = arg("head") || (localRepo ? "HEAD" : "main");

function git(args) {
  return execFileSync("git", ["-C", localRepo, ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

async function githubJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "ag-ui-docs-zh-watch",
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

/** 上游协议版本 tag，按语义顺序升序。 */
async function protocolTags() {
  let names;
  if (localRepo) {
    names = git(["tag", "-l", "ag-ui-protocol@*"]).split("\n");
  } else {
    const refs = await githubJson(
      `https://api.github.com/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/git/matching-refs/tags/ag-ui-protocol%40`,
    );
    names = refs.map((ref) => ref.ref.replace("refs/tags/", ""));
  }
  return names
    .map((name) => {
      const match = name.trim().match(PROTOCOL_TAG);
      return match
        ? { name: name.trim(), version: `${match[1]}.${match[2]}.${match[3]}`, parts: match.slice(1, 4).map(Number) }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.parts[0] - b.parts[0] || a.parts[1] - b.parts[1] || a.parts[2] - b.parts[2]);
}

/** 返回 { sha, date, files: Map<path, blobSha> } */
async function snapshot(ref) {
  if (localRepo) {
    const sha = git(["rev-parse", ref]).trim();
    const date = git(["log", "-1", "--format=%cs", sha]).trim();
    const files = new Map();
    for (const line of git(["ls-tree", "-r", sha, "--", "docs/concepts", "docs/spec", DOCS_JSON]).split("\n")) {
      const parsed = line.match(/^\d+ \w+ ([0-9a-f]+)\t(.+)$/);
      if (parsed) files.set(parsed[2], parsed[1]);
    }
    return { sha, date, files };
  }
  const commit = await githubJson(
    `https://api.github.com/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/commits/${encodeURIComponent(ref)}`,
  );
  const tree = await githubJson(
    `https://api.github.com/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/git/trees/${commit.sha}?recursive=1`,
  );
  if (tree.truncated) throw new Error("upstream tree is truncated; cannot diff reliably");
  const files = new Map();
  for (const entry of tree.tree) {
    if (entry.type !== "blob") continue;
    if (entry.path === DOCS_JSON || WATCHED_PREFIXES.some((p) => entry.path.startsWith(p))) {
      files.set(entry.path, entry.sha);
    }
  }
  return { sha: commit.sha, date: (commit.commit?.committer?.date ?? "").slice(0, 10), files };
}

const before = await snapshot(base);
const after = await snapshot(head);

const added = [];
const removed = [];
const modified = [];
for (const [path, sha] of after.files) {
  if (!before.files.has(path)) added.push(path);
  else if (before.files.get(path) !== sha) modified.push(path);
}
for (const path of before.files.keys()) if (!after.files.has(path)) removed.push(path);

const addedBySha = new Map(added.map((path) => [after.files.get(path), path]));
const renames = [];
for (const path of [...removed]) {
  const twin = addedBySha.get(before.files.get(path));
  if (!twin) continue;
  renames.push([path, twin]);
  removed.splice(removed.indexOf(path), 1);
  added.splice(added.indexOf(twin), 1);
}

const bucket = (path) => {
  if (path === DOCS_JSON) return "nav";
  if (path.startsWith("docs/concepts/")) return "concepts";
  if (path.startsWith("docs/spec/draft/")) return "draft";
  if (path.startsWith("docs/spec/")) return "spec";
  return "other";
};

const changes = [
  ...added.map((path) => ({ kind: "新增", path, bucket: bucket(path) })),
  ...modified.map((path) => ({ kind: "修改", path, bucket: bucket(path) })),
  ...removed.map((path) => ({ kind: "删除", path, bucket: bucket(path) })),
  ...renames.map(([from, to]) => ({ kind: "重命名", path: `${from} → ${to}`, bucket: bucket(to) })),
];

const counts = changes.reduce((acc, c) => ({ ...acc, [c.bucket]: (acc[c.bucket] ?? 0) + 1 }), {});

const tags = await protocolTags();
const lockedParts = lock.protocolVersion ? lock.protocolVersion.split(".").map(Number) : null;
const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
const newerTags = lockedParts ? tags.filter((tag) => cmp(tag.parts, lockedParts) > 0) : [];
const latest = newerTags.at(-1) ?? null;
const releaseBump = latest
  ? latest.parts[0] !== lockedParts[0]
    ? "major"
    : latest.parts[1] !== lockedParts[1]
      ? "minor"
      : "patch"
  : null;

const releaseActionable = releaseBump === "major" || releaseBump === "minor";

let severity = "none";
if (releaseActionable) severity = "spec-release";
else if (counts.spec) severity = "spec";
else if (counts.concepts) severity = "concepts";
else if (counts.draft || counts.nav || counts.other) severity = "draft";

const headline = {
  "spec-release": `协议发布 ${lock.protocolVersion} → ${latest?.version}（${releaseBump}）`,
  spec: `1.0 规范有 ${counts.spec} 处变化`,
  concepts: `concepts 有 ${counts.concepts} 处变化`,
  draft: latest ? `仅有 patch 版本 ${latest.version} 与 draft/导航变化` : "仅 draft/导航变化",
  none: latest ? `仅有 patch 版本 ${latest.version}，按约定不跟随` : "无变化",
}[severity];

const translated = lock.files ?? {};
const section = (title, bucketName, hint) => {
  const rows = changes.filter((c) => c.bucket === bucketName);
  if (!rows.length) return "";
  const lines = [`### ${title}`, ""];
  if (hint) lines.push(hint, "");
  for (const row of rows) {
    const zh = translated[row.path]
      ? `（译文：\`content/zh/${row.path.replace(/^docs\//, "").replace(/\.mdx$/, ".md")}\`）`
      : "（未翻译）";
    lines.push(`- ${row.kind} \`${row.path}\`${row.kind === "重命名" ? "" : " " + zh}`);
  }
  return `${lines.join("\n")}\n`;
};

const baseLabel = since ? "上次报告" : "锁文件基线";
const lines = [
  "# 上游文档变更报告",
  "",
  "| 项 | 值 |",
  "| --- | --- |",
  `| ${baseLabel} | \`${before.sha.slice(0, 9)}\`（${before.date || "未知"}） |`,
  `| 上游 commit | \`${after.sha.slice(0, 9)}\`（${after.date || "未知"}） |`,
  `| 判定 | **${severity}** — ${headline} |`,
  "",
];

if (latest && !releaseActionable) {
  lines.push(
    "## 协议版本",
    "",
    `- 已锁定版本：\`${lock.protocolVersion}\``,
    `- 上游最新版本：\`${latest.version}\`（tag \`${latest.name}\`）`,
    `- 变更类型：**${releaseBump}** — 按约定只跟随 major/minor，patch 不触发翻译。`,
    "",
  );
}

if (releaseActionable) {
  lines.push(
    "## 协议发布",
    "",
    `- 已锁定版本：\`${lock.protocolVersion}\`${lock.protocolTag ? `（tag \`${lock.protocolTag}\`）` : ""}`,
    `- 上游最新版本：\`${latest.version}\`（tag \`${latest.name}\`）`,
    `- 变更类型：**${releaseBump}**`,
    "",
    "这是 major/minor 节点：按发布节奏应对新版本做整批翻译，而不是逐页跟改。",
    "",
  );
}

const hasActionable = ["spec-release", "spec", "concepts"].includes(severity);
lines.push(
  section("规范页面变化（docs/spec/1.0）", "spec", "关系协议契约，优先级最高。"),
  section("概念文档变化（docs/concepts）", "concepts", "解释设计取向，读者理解依赖它。"),
  section("导航变化（docs/docs.json）", "nav", "只影响站点目录结构，通常无需改译文。"),
  section("草案变化（docs/spec/draft）", "draft", "1.1 工作区，未冻结，不翻译，仅作观察。"),
  section("其他", "other"),
);

if (!changes.length && !latest) {
  lines.push("范围内无变化。", "");
} else if (!hasActionable) {
  lines.push("以上均不影响译文，本轮无需行动。", "");
} else {
  lines.push(
    "## 下一步",
    "",
    "1. 逐条核对上面列出的页面，判断是措辞微调还是语义变化。",
    "2. 语义变化才改译文；措辞微调可忽略。",
    "3. 全部评估完后，把锁文件推进到新基线并重跑校验：",
    "",
    "   ```bash",
    `   node scripts/fetch-upstream.mjs --update --ref ${after.sha}${latest ? ` --protocol-tag ${latest.name}` : ""}`,
    "   npm run check",
    "   ```",
    "",
    "4. 锁文件与译文改动放在同一个 commit 里，方便回溯「译文对应哪一版原文」。",
    "",
  );
}

await fs.writeFile(REPORT, `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`);

if (process.env.GITHUB_OUTPUT) {
  await fs.appendFile(
    process.env.GITHUB_OUTPUT,
    `severity=${severity}\nhas_changes=${hasActionable}\nheadline=${headline.replace(/\n/g, " ")}\nhead_sha=${after.sha}\n`,
  );
}

console.log(`check-upstream-changes: ${severity} — ${headline}（${changes.length} 处文件变化）`);
if (latest) {
  console.log(`  协议 tag：锁定 ${lock.protocolVersion} → 最新 ${latest.version}（${releaseBump}）`);
}
console.log(`报告已写入 ${REPORT}`);
