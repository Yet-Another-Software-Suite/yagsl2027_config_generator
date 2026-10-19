"use client"

import { useEffect, useState, type ReactNode } from "react"
import { CircleAlert } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

/** Before the modules of a real robot move for the first time on this connection. */
export const ON_BLOCKS_CHECKLIST = [
  "The robot is up on blocks, and every wheel is clear of the blocks and the floor.",
  "Every module can turn all the way around without touching wires, bumpers, the blocks or anything else.",
  "Nobody is touching the robot, and hands and loose clothing are away from the modules.",
  "Someone is at the Driver Station, ready to disable the robot.",
]

/** Before a real robot spins in place on the floor. */
export const ON_FLOOR_CHECKLIST = [
  "The robot is off the blocks and on the floor.",
  "There is room all around it, and nobody is near it.",
  "Someone is at the Driver Station, ready to disable the robot.",
]

/** A checklist that has to be ticked, item by item, before the confirm button works. */
export function SafetyDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  intro,
  items,
  confirmLabel,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  intro: ReactNode
  items: string[]
  confirmLabel: string
}) {
  const [ticked, setTicked] = useState<boolean[]>(() => items.map(() => false))
  useEffect(() => {
    if (open) setTicked(items.map(() => false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  const all = ticked.every(Boolean)
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CircleAlert className="h-5 w-5 text-destructive" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div>{intro}</div>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <label key={item} className="flex cursor-pointer items-start gap-2 text-foreground">
                    <Checkbox
                      checked={ticked[i]}
                      onCheckedChange={(v) => setTicked((prev) => prev.map((x, j) => (j === i ? v === true : x)))}
                      className="mt-0.5"
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={!all} onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
