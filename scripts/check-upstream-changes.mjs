#!/usr/bin/env node
/**
 * 对比 upstream.lock.json 记录的基线与上游当前 HEAD，生成待处理报告。
 *
 * 分类与严重度（取最高者）：
 *   spec-release  出现新的规范版本目录（docs/spec/1.0 → docs/spec/1.1），
 *                 或 docs.json 的版本列表发生变化 —— 对应 major/minor 发布
 *   spec          已冻结版本（docs/spec/1.0/**）有任何增删改
 *   concepts      docs/concepts/** 有任何增删改
 *   draft         仅 docs/spec/draft/** 变化；不翻译，仅供参考，不触发通知
 *   none          范围内无变化
 *
 * 用法：
 *   node scripts/check-upstream-changes.mjs                        # CI：读锁文件 vs 上游 main
 *   node scripts/check-upstream-changes.mjs --head <sha>
 *   node scripts/check-upstream-changes.mjs --local-repo ../ag-ui # 本地：用本地 clone，不联网
 *   node scripts/check-upstream-changes.mjs --base <sha> --head <sha> --local-repo ../ag-ui
 *
 * 输出：sync-report.md，以及 $GITHUB_OUTPUT 里的 severity / has_changes / headline。
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
const VERSION_DIR = /^docs\/spec\/(\d+\.\d+)\//;

const lock = JSON.parse(await fs.readFile(LOCK_FILE, "utf8"));
const base = arg("base", lock.sha);
const head = arg("head") || (localRepo ? "origin/main" : "main");

function git(args) {
  return execFileSync("git", ["-C", localRepo, ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

async function githubJson(url, accept = "application/vnd.github+json") {
  const res = await fetch(url, {
    headers: {
      Accept: accept,
      "User-Agent": "ag-ui-docs-zh-watch",
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res;
}

/** 返回 { sha, date, files: Map<path, blobSha> } */
async function snapshot(ref) {
  if (localRepo) {
    const sha = git(["rev-parse", ref]).trim();
    const date = git(["log", "-1", "--format=%cs", sha]).trim();
    const out = git(["ls-tree", "-r", sha, "--", "docs/concepts", "docs/spec", DOCS_JSON]);
    const files = new Map();
    for (const line of out.split("\n")) {
      if (!line.trim()) continue;
      const [, meta, path] = line.match(/^(\d+ \w+ [0-9a-f]+)\t(.+)$/) ?? [];
      if (!path) continue;
      files.set(path, meta.split(" ")[2]);
    }
    return { sha, date, files };
  }
  const commit = await (await githubJson(
    `https://api.github.com/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/commits/${encodeURIComponent(ref)}`,
  )).json();
  const tree = await (await githubJson(
    `https://api.github.com/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/git/trees/${commit.sha}?recursive=1`,
  )).json();
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

async function docsJsonVersions(sha) {
  let text;
  if (localRepo) {
    try {
      text = git(["show", `${sha}:${DOCS_JSON}`]);
    } catch {
      return [];
    }
  } else {
    try {
      text = await (await githubJson(
        `https://api.github.com/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/contents/${DOCS_JSON}?ref=${sha}`,
        "application/vnd.github.raw",
      )).text();
    } catch {
      return [];
    }
  }
  try {
    const versions = [];
    const walk = (node) => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node.versions)) versions.push(...node.versions.map((v) => v.version));
      Object.values(node).forEach(walk);
    };
    walk(JSON.parse(text));
    return versions;
  } catch {
    return [];
  }
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
for (const path of before.files.keys()) {
  if (!after.files.has(path)) removed.push(path);
}

// 同一 blob 出现在删除与新增两侧 = 重命名
const addedBySha = new Map();
for (const path of added) addedBySha.set(after.files.get(path), path);
const renames = [];
for (const path of [...removed]) {
  const twin = addedBySha.get(before.files.get(path));
  if (twin) {
    renames.push([path, twin]);
    removed.splice(removed.indexOf(path), 1);
    added.splice(added.indexOf(twin), 1);
  }
}

const bucket = (path) => {
  if (path === DOCS_JSON) return "nav";
  if (path.startsWith("docs/concepts/")) return "concepts";
  if (path.startsWith("docs/spec/draft/")) return "draft";
  if (path.startsWith("docs/spec/")) return "spec";
  return "other";
};

const specDirsBefore = new Set([...before.files.keys()].filter((p) => VERSION_DIR.test(p)).map((p) => p.match(VERSION_DIR)[1]));
const specDirsAfter = new Set([...after.files.keys()].filter((p) => VERSION_DIR.test(p)).map((p) => p.match(VERSION_DIR)[1]));
const newSpecVersions = [...specDirsAfter].filter((v) => !specDirsBefore.has(v) && v !== "draft");
const droppedSpecVersions = [...specDirsBefore].filter((v) => !specDirsAfter.has(v));

const versionsBefore = await docsJsonVersions(before.sha);
const versionsAfter = await docsJsonVersions(after.sha);
const navVersionsChanged = JSON.stringify(versionsBefore) !== JSON.stringify(versionsAfter);

const changes = [
  ...[...added].map((path) => ({ kind: "新增", path, bucket: bucket(path) })),
  ...[...modified].map((path) => ({ kind: "修改", path, bucket: bucket(path) })),
  ...[...removed].map((path) => ({ kind: "删除", path, bucket: bucket(path) })),
  ...renames.map(([from, to]) => ({ kind: "重命名", path: `${from} → ${to}`, bucket: bucket(to) })),
];

const counts = changes.reduce((acc, c) => ({ ...acc, [c.bucket]: (acc[c.bucket] ?? 0) + 1 }), {});
const isSpecRelease = newSpecVersions.length > 0 || droppedSpecVersions.length > 0 || navVersionsChanged;

let severity = "none";
if (isSpecRelease) severity = "spec-release";
else if (counts.spec) severity = "spec";
else if (counts.concepts) severity = "concepts";
else if (counts.draft || counts.nav || counts.other) severity = "draft";
else if (changes.length) severity = "draft";

const headline = severity === "spec-release"
  ? `规范版本更新${newSpecVersions.length ? `：新增 ${newSpecVersions.join("、")}` : ""}`
  : severity === "spec"
    ? `1.0 规范有 ${counts.spec} 处变化`
    : severity === "concepts"
      ? `concepts 有 ${counts.concepts} 处变化`
      : severity === "draft"
        ? "仅 draft/导航变化"
        : "无变化";

const translated = lock.files ?? {};
const section = (title, bucketName, hint) => {
  const rows = changes.filter((c) => c.bucket === bucketName);
  if (!rows.length) return "";
  const lines = [`### ${title}`, ""];
  if (hint) lines.push(hint, "");
  for (const row of rows) {
    const path = row.path;
    const zh = translated[path] ? `（译文：content/zh/${path.replace(/^docs\//, "").replace(/\.mdx$/, ".md")}）` : "（未翻译）";
    lines.push(`- ${row.kind} \`${path}\`${row.kind === "重命名" ? "" : " " + zh}`);
  }
  lines.push("");
  return lines.join("\n");
};

const lines = [
  "# 上游文档变更报告",
  "",
  "| 项 | 值 |",
  "| --- | --- |",
  `| 基线 commit | \`${before.sha.slice(0, 9)}\`（${before.date || "未知"}） |`,
  `| 上游 commit | \`${after.sha.slice(0, 9)}\`（${after.date || "未知"}） |`,
  `| 判定 | **${severity}** — ${headline} |`,
  "",
];

if (isSpecRelease) {
  lines.push("## 规范版本变化", "");
  if (newSpecVersions.length) lines.push(`- 新增版本目录：${newSpecVersions.map((v) => `\`docs/spec/${v}/\``).join("、")}`);
  if (droppedSpecVersions.length) lines.push(`- 移除版本目录：${droppedSpecVersions.map((v) => `\`docs/spec/${v}/\``).join("、")}`);
  if (navVersionsChanged) {
    lines.push(`- \`docs/docs.json\` 版本列表：${versionsBefore.join(" / ") || "（无）"} → ${versionsAfter.join(" / ") || "（无）"}`);
  }
  lines.push("", "这对应一次 major/minor 节点：按发布节奏需要对整批新版本做翻译，而不是逐页跟改。", "");
}

const hasActionable = ["spec-release", "spec", "concepts"].includes(severity);
lines.push(
  section("规范页面变化（docs/spec）", "spec", "这些页面关系协议契约，优先级最高。"),
  section("概念文档变化（docs/concepts）", "concepts", "这些页面解释设计取向，读者理解依赖它。"),
  section("导航变化（docs/docs.json）", "nav", "只影响站点目录结构，通常无需改译文。"),
  section("草案变化（docs/spec/draft）", "draft", "1.1 工作区，尚未冻结，暂不翻译，仅作观察。"),
  section("其他", "other"),
);

if (!changes.length) {
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
    `   node scripts/fetch-upstream.mjs --update --ref ${after.sha}`,
    "   npm run check",
    "   ```",
    "",
    "4. 提交时把锁文件与译文改动放在同一个 commit 里，方便回溯「译文对应哪一版原文」。",
    "",
  );
}

const report = `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
await fs.writeFile(REPORT, report);

if (process.env.GITHUB_OUTPUT) {
  await fs.appendFile(
    process.env.GITHUB_OUTPUT,
    `severity=${severity}\nhas_changes=${hasActionable}\nheadline=${headline.replace(/\n/g, " ")}\nhead_sha=${after.sha}\n`,
  );
}

console.log(`check-upstream-changes: ${severity} — ${headline}（${changes.length} 处变化）`);
console.log(`报告已写入 ${REPORT}`);
