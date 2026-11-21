import path from "node:path";

export const UPSTREAM_OWNER = "ag-ui-protocol";
export const UPSTREAM_REPO = "ag-ui";
export const LOCK_FILE = "upstream.lock.json";
export const CACHE_DIR = ".cache/upstream";
export const CONTENT_DIR = "content/zh";
export const SCOPE_PREFIXES = ["docs/concepts/", "docs/spec/1.0/"];

export const CALLOUTS = {
  Note: "[!NOTE]",
  Warning: "[!WARNING]",
  Tip: "[!TIP]",
};

export function isInScope(upstreamPath) {
  return SCOPE_PREFIXES.some((p) => upstreamPath.startsWith(p)) && upstreamPath.endsWith(".mdx");
}

/** docs/concepts/state.mdx -> content/zh/concepts/state.md */
export function upstreamToContent(upstreamPath) {
  const rel = upstreamPath.replace(/^docs\//, "").replace(/\.mdx$/, ".md");
  return path.posix.join(CONTENT_DIR, rel);
}

/** content/zh/concepts/state.md -> docs/concepts/state.mdx */
export function contentToUpstream(contentPath) {
  const rel = contentPath.replace(/^content\/zh\//, "").replace(/\.md$/, ".mdx");
  return `docs/${rel}`;
}

export function cachedUpstreamPath(upstreamPath) {
  return path.posix.join(CACHE_DIR, upstreamPath);
}
