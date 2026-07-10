import type React from "react"
import { CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function ComparisonGrid({ children }: { children: React.ReactNode }) {
  // break-inside:avoid isn't reliably honored on the grid box itself in every print engine
  // (Safari/WebKit in particular), so it goes on this plain wrapper instead
  return (
    <div className="print-avoid-break">
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">{children}</div>
    </div>
  )
}

export function ComparisonPanel({
  variant,
  caption,
  children,
}: {
  variant: "correct" | "incorrect"
  caption: string
  children: React.ReactNode
}) {
  const isCorrect = variant === "correct"
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        isCorrect ? "border-green-600/30 bg-green-600/5" : "border-destructive/30 bg-destructive/5",
      )}
    >
      <div
        className={cn(
          "mb-1 flex items-center gap-1.5 text-xs font-semibold",
          isCorrect ? "text-green-600 dark:text-green-400" : "text-destructive",
        )}
      >
        {isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
        {isCorrect ? "Expected" : "Incorrect"}
      </div>
      {children}
      <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
    </div>
  )
}
