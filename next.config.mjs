// On GitHub Pages, a project site (not a custom domain) is served at
// https://<org>.github.io/<repo-name>/ -- every absolute "/..." path needs that
// repo-name prefix, or it 404s. This only applies in GitHub Actions (GITHUB_ACTIONS
// is set automatically there); local dev and any future custom-domain deploy are
// unaffected. If this repo ever moves to its own domain, this whole block can go.
const isGithubActions = process.env.GITHUB_ACTIONS === "true"
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1]
const basePath = "" //isGithubActions && repoName ? `/${repoName}` : ""

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath,
  // next/link and next/router pick up `basePath` above automatically, but next/image
  // (with unoptimized images, below) and metadata.icons don't -- they emit raw src/href
  // strings, so components that need it read this to prefix asset paths themselves.
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
