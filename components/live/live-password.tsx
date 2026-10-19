"use client"

import { useEffect, useState } from "react"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// SHA-256 of the Live mode password. This site has no server, so this only keeps Live mode from being turned on
// by accident; it is not access control.
export const LIVE_PASSWORD_SHA256 = "059f925e3235f6bee026a14e2ce635b6753ecc678f03bcb83a674dd1d631eeb3"

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("")
}

/** Asks for the Live mode password. */
export function LivePasswordDialog({
  open,
  onOpenChange,
  onUnlocked,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUnlocked: () => void
}) {
  const [password, setPassword] = useState("")
  const [wrong, setWrong] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (open) {
      setPassword("")
      setWrong(false)
    }
  }, [open])

  const submit = async () => {
    setChecking(true)
    const ok = (await sha256Hex(password)) === LIVE_PASSWORD_SHA256
    setChecking(false)
    if (ok) onUnlocked()
    else setWrong(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Live mode
            </DialogTitle>
            <DialogDescription>Enter the password to turn on Live mode.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label htmlFor="live-password">Password</Label>
            <Input
              id="live-password"
              type="password"
              autoComplete="off"
              autoFocus
              value={password}
              aria-invalid={wrong}
              onChange={(e) => {
                setPassword(e.target.value)
                setWrong(false)
              }}
            />
            {wrong && <p className="text-xs text-destructive">That password isn't right.</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="bg-transparent" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!password || checking}>
              Turn on Live mode
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
