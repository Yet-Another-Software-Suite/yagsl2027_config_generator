import type React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function Step({
  id,
  title,
  detail,
  checked,
  onCheckedChange,
  children,
}: {
  id: string
  title: React.ReactNode
  detail?: React.ReactNode
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors",
        checked ? "border-green-600/30 bg-green-600/5" : "border-border",
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          className="mt-0.5 shrink-0"
        />
        <div className="flex-1 space-y-2">
          <Label
            htmlFor={id}
            className={cn(
              "block cursor-pointer text-sm font-medium leading-snug",
              checked ? "text-muted-foreground line-through" : "text-foreground",
            )}
          >
            {title}
          </Label>
          {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
          {children}
        </div>
      </div>
    </div>
  )
}
