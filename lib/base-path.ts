// Mirrors the basePath computed in next.config.mjs (empty locally, "/repo-name" on GitHub
// Pages). next/link and the router apply that automatically, but raw asset references --
// unoptimized next/image src, metadata.icons -- don't, so prefix those with this.
export function withBasePath(path: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`
}
