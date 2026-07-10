"use client"

import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PrintButton({ className }: { className?: string }) {
  return (
    <Button variant="outline" size="sm" className={className ?? "bg-transparent"} onClick={() => window.print()}>
      <Printer className="mr-2 h-4 w-4" />
      Print
    </Button>
  )
}
