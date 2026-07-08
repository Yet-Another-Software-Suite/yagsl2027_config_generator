"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { PIDFPropertiesConfig } from "@/lib/types"

interface PIDFPropertiesProps {
  config: PIDFPropertiesConfig
  onChange: (config: PIDFPropertiesConfig) => void
}

export function PIDFProperties({ config, onChange }: PIDFPropertiesProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">PID Properties</h3>

      {/* Drive PID */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Drive Motor PID</h4>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>P (Proportional)</Label>
            <Input
              type="number"
              step="0.001"
              value={config.drive.p}
              onChange={(e) =>
                onChange({
                  ...config,
                  drive: { ...config.drive, p: Number(e.target.value) },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>I (Integral)</Label>
            <Input
              type="number"
              step="0.001"
              value={config.drive.i}
              onChange={(e) =>
                onChange({
                  ...config,
                  drive: { ...config.drive, i: Number(e.target.value) },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>D (Derivative)</Label>
            <Input
              type="number"
              step="0.001"
              value={config.drive.d}
              onChange={(e) =>
                onChange({
                  ...config,
                  drive: { ...config.drive, d: Number(e.target.value) },
                })
              }
            />
          </div>
        </div>

        <h5 className="text-xs font-medium mb-3 mt-4 text-muted-foreground">Feedforward (Optional)</h5>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>S (kS)</Label>
            <Input
              type="number"
              step="0.001"
              placeholder="Optional"
              value={config.drive.s ?? ""}
              onChange={(e) =>
                onChange({
                  ...config,
                  drive: { ...config.drive, s: e.target.value ? Number(e.target.value) : undefined },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>V (kV)</Label>
            <Input
              type="number"
              step="0.001"
              placeholder="Optional"
              value={config.drive.v ?? ""}
              onChange={(e) =>
                onChange({
                  ...config,
                  drive: { ...config.drive, v: e.target.value ? Number(e.target.value) : undefined },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>A (kA)</Label>
            <Input
              type="number"
              step="0.001"
              placeholder="Optional"
              value={config.drive.a ?? ""}
              onChange={(e) =>
                onChange({
                  ...config,
                  drive: { ...config.drive, a: e.target.value ? Number(e.target.value) : undefined },
                })
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Angle PID */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Angle Motor PID</h4>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>P (Proportional)</Label>
            <Input
              type="number"
              step="0.001"
              value={config.angle.p}
              onChange={(e) =>
                onChange({
                  ...config,
                  angle: { ...config.angle, p: Number(e.target.value) },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>I (Integral)</Label>
            <Input
              type="number"
              step="0.001"
              value={config.angle.i}
              onChange={(e) =>
                onChange({
                  ...config,
                  angle: { ...config.angle, i: Number(e.target.value) },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>D (Derivative)</Label>
            <Input
              type="number"
              step="0.001"
              value={config.angle.d}
              onChange={(e) =>
                onChange({
                  ...config,
                  angle: { ...config.angle, d: Number(e.target.value) },
                })
              }
            />
          </div>
        </div>

        <h5 className="text-xs font-medium mb-3 mt-4 text-muted-foreground">Feedforward (Optional)</h5>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>S (kS)</Label>
            <Input
              type="number"
              step="0.001"
              placeholder="Optional"
              value={config.angle.s ?? ""}
              onChange={(e) =>
                onChange({
                  ...config,
                  angle: { ...config.angle, s: e.target.value ? Number(e.target.value) : undefined },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>V (kV)</Label>
            <Input
              type="number"
              step="0.001"
              placeholder="Optional"
              value={config.angle.v ?? ""}
              onChange={(e) =>
                onChange({
                  ...config,
                  angle: { ...config.angle, v: e.target.value ? Number(e.target.value) : undefined },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>A (kA)</Label>
            <Input
              type="number"
              step="0.001"
              placeholder="Optional"
              value={config.angle.a ?? ""}
              onChange={(e) =>
                onChange({
                  ...config,
                  angle: { ...config.angle, a: e.target.value ? Number(e.target.value) : undefined },
                })
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
