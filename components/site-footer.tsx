"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ON_SYSTEMCORE, REPO, REPO_URL } from "@/lib/site"

const VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? ""
/** A build from CI has a version such as 0.1.0+12.abc1234, ending in the short hash of its commit. */
const COMMIT = /\+\d+\.([0-9a-f]{7,40})$/.exec(VERSION)?.[1]

const RELEASES_URL = `${REPO_URL}/releases/latest`

/** The .ipk the Pages deploy built from the same commit and serves beside the site. */
const BUILT_IPK_FILE = process.env.NEXT_PUBLIC_IPK_FILE
const BUILT_IPK_VERSION = process.env.NEXT_PUBLIC_IPK_VERSION
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ""

interface Ipk {
  url: string
  version: string
}

const BUILT_IPK: Ipk | null =
  BUILT_IPK_FILE && BUILT_IPK_VERSION
    ? { url: `${BASE_PATH}/${encodeURIComponent(BUILT_IPK_FILE)}`, version: BUILT_IPK_VERSION }
    : null

/**
 * Links to the .ipk built with this copy of the site. A build without one, such as `pnpm dev`, links to the .ipk
 * attached to the latest GitHub release instead, or the releases page if it can't be found.
 */
function IpkDownload() {
  const [latest, setLatest] = useState<Ipk | null>(null)
  const ipk = BUILT_IPK ?? latest

  useEffect(() => {
    if (BUILT_IPK) return
    const controller = new AbortController()
    fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((release) => {
        const asset = release?.assets?.find((a: { name: string }) => a.name.endsWith(".ipk"))
        if (asset) setLatest({ url: asset.browser_download_url, version: release.tag_name })
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <Button variant="outline" size="sm" className="bg-transparent" asChild>
        <a
          href={ipk?.url ?? RELEASES_URL}
          download={BUILT_IPK ? BUILT_IPK_FILE : undefined}
          target={ipk ? undefined : "_blank"}
          rel="noreferrer"
          data-live="ipk-download"
        >
          <Download className="mr-2 h-4 w-4" />
          Download for SystemCore (.ipk)
        </a>
      </Button>
      <span className="text-xs text-muted-foreground">
        Install it by dragging the .ipk onto http://robot.local, then open the yagsl-config tile.
      </span>
    </div>
  )
}

/** The version of this build and, off the robot, a download of it as a SystemCore package. */
export function SiteFooter({ className }: { className?: string }) {
  const label = `YAGSL Config Generator v${VERSION}`
  return (
    <footer className={cn("no-print border-t border-border", className)}>
      <div className="container mx-auto flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        {ON_SYSTEMCORE ? (
          <span className="text-xs text-muted-foreground">Served from this SystemCore.</span>
        ) : (
          <IpkDownload />
        )}
        <span className="font-mono text-xs text-muted-foreground" data-live="version">
          {COMMIT ? (
            <a
              href={`${REPO_URL}/commit/${COMMIT}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground hover:underline"
              title="The commit this build came from"
            >
              {label}
            </a>
          ) : (
            label
          )}
        </span>
      </div>
    </footer>
  )
}
