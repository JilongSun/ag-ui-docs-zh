import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {
  CACHE_DIR, LOCK_FILE, UPSTREAM_OWNER, UPSTREAM_REPO, cachedUpstreamPath, isInScope,
} from "./config.mjs";

const args = process.argv.slice(2);
const update = args.includes("--update");
const refIndex = args.indexOf("--ref");
const explicitRef = refIndex !== -1 ? args[refIndex + 1] : null;
const localIndex = args.indexOf("--from-local");
const localDir = localIndex !== -1 ? args[localIndex + 1] : null;

async function readLock() {
  try {
    return JSON.parse(await fs.readFile(LOCK_FILE, "utf8"));
  } catch {
    return null;
  }
}

async function githubJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "ag-ui-docs-zh-sync",
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

let rawAvailable;

async function fetchRaw(upstreamPath, sha) {
  if (rawAvailable === undefined) {
    try {
      const probe = await fetch(
        `https://raw.githubusercontent.com/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/${sha}/README.md`,
        { headers: { "User-Agent": "ag-ui-docs-zh-sync" }, signal: AbortSignal.timeout(5000) },
      );
      rawAvailable = probe.ok;
    } catch {
      rawAvailable = false;
    }
  }
  if (rawAvailable) {
    const rawUrl = `https://raw.githubusercontent.com/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/${sha}/${upstreamPath}`;
    try {
      const res = await fetch(rawUrl, {
        headers: { "User-Agent": "ag-ui-docs-zh-sync" },
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    } catch {
      // fall through to the API
    }
  }
  const apiUrl = `https://api.github.com/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/contents/${upstreamPath}?ref=${sha}`;
  const res = await fetch(apiUrl, {
    headers: {
      Accept: "application/vnd.github.raw",
      "User-Agent": "ag-ui-docs-zh-sync",
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${apiUrl}`);
  return Buffer.from(await res.arrayBuffer());
}

async function listLocalFiles(root) {
  const out = [];
  async function walk(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else {
        const rel = path.relative(root, full).split(path.sep).join("/");
        if (isInScope(rel)) out.push(rel);
      }
    }
  }
  await walk(path.join(root, "docs"));
  return out.sort();
}

async function listScopeFiles(sha) {
  if (localDir) return listLocalFiles(localDir);
  const tree = await githubJson(
    `https://api.github.com/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/git/trees/${sha}?recursive=1`,
  );
  return tree.tree
    .filter((entry) => entry.type === "blob" && isInScope(entry.path))
    .map((entry) => entry.path)
    .sort();
}

const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

const lock = await readLock();
const sha = explicitRef || lock?.sha;
if (!sha) {
  console.error("No upstream SHA: pass --ref <sha> or run with --update <sha>.");
  process.exit(2);
}

const files = update || !lock ? await listScopeFiles(sha) : Object.keys(lock.files);
const failures = [];
const nextHashes = {};

for (const upstreamPath of files) {
  const buf = localDir
    ? await fs.readFile(path.join(localDir, upstreamPath))
    : await fetchRaw(upstreamPath, sha);
  const hash = sha256(buf);
  const expected = lock?.files?.[upstreamPath];
  if (!update && expected && expected !== hash) {
    failures.push(`${upstreamPath}: hash mismatch (lock ${expected.slice(0, 12)}, upstream ${hash.slice(0, 12)})`);
  }
  nextHashes[upstreamPath] = hash;
  const target = cachedUpstreamPath(upstreamPath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, buf);
}

if (update || !lock) {
  const sorted = Object.fromEntries(Object.entries(nextHashes).sort(([a], [b]) => a.localeCompare(b)));
  const next = {
    upstream: `${UPSTREAM_OWNER}/${UPSTREAM_REPO}`,
    ref: sha,
    sha,
    fetchedAt: new Date().toISOString(),
    source: localDir ? `local checkout + api spot-check (${sha})` : "github",
    files: sorted,
  };
  await fs.writeFile(LOCK_FILE, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`Fetched ${files.length} files at ${sha.slice(0, 12)}; wrote ${LOCK_FILE}.`);
} else {
  console.log(`Verified ${files.length} cached files against ${LOCK_FILE} (${sha.slice(0, 12)}).`);
}

if (failures.length) {
  console.error(`\n${failures.length} file(s) drifted from the lock:`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error(`\nUpstream content changed. Bump the SHA with --update --ref <sha> after reviewing the diff.`);
  process.exit(1);
}

await fs.mkdir(CACHE_DIR, { recursive: true });
