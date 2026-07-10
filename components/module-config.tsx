"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import type { ModuleConfigData } from "@/lib/types"
import { MOTOR_TYPES, ENCODER_TYPES } from "@/lib/config-options"

interface ModuleConfigProps {
  moduleName: string
  config: ModuleConfigData
  onChange: (config: ModuleConfigData) => void
}

export function ModuleConfig({ moduleName, config, onChange }: ModuleConfigProps) {
  const isAttached = config.absoluteEncoder.type.endsWith("_attached")
  const usesChannel = config.absoluteEncoder.type.endsWith("_dio") || config.absoluteEncoder.type.endsWith("_analog")
  const showEncoderFields = !isAttached

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">{moduleName} Module</h3>

      {/* Drive Motor */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Drive Motor</h4>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Motor Type</Label>
            <Select
              value={config.drive.type}
              onValueChange={(value) =>
                onChange({
                  ...config,
                  drive: { ...config.drive, type: value as any },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOTOR_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>CAN ID</Label>
            <Input
              type="number"
              value={config.drive.id}
              onChange={(e) =>
                onChange({
                  ...config,
                  drive: { ...config.drive, id: Number(e.target.value) },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>CAN Bus</Label>
            <Input
              value={config.drive.canbus}
              placeholder="Default"
              onChange={(e) =>
                onChange({
                  ...config,
                  drive: { ...config.drive, canbus: e.target.value },
                })
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Angle Motor */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Angle Motor</h4>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Motor Type</Label>
            <Select
              value={config.angle.type}
              onValueChange={(value) =>
                onChange({
                  ...config,
                  angle: { ...config.angle, type: value as any },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOTOR_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>CAN ID</Label>
            <Input
              type="number"
              value={config.angle.id}
              onChange={(e) =>
                onChange({
                  ...config,
                  angle: { ...config.angle, id: Number(e.target.value) },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>CAN Bus</Label>
            <Input
              value={config.angle.canbus}
              placeholder="Default"
              onChange={(e) =>
                onChange({
                  ...config,
                  angle: { ...config.angle, canbus: e.target.value },
                })
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Absolute Encoder */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Absolute Encoder</h4>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Encoder Type</Label>
            <Select
              value={config.absoluteEncoder.type}
              onValueChange={(value) =>
                onChange({
                  ...config,
                  absoluteEncoder: { ...config.absoluteEncoder, type: value as any },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENCODER_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showEncoderFields && !usesChannel && (
            <div className="space-y-2">
              <Label>CAN ID</Label>
              <Input
                type="number"
                value={config.absoluteEncoder.id}
                onChange={(e) =>
                  onChange({
                    ...config,
                    absoluteEncoder: {
                      ...config.absoluteEncoder,
                      id: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
          )}

          {showEncoderFields && usesChannel && (
            <div className="space-y-2">
              <Label>Channel</Label>
              <Input
                type="number"
                value={config.absoluteEncoder.channel}
                onChange={(e) =>
                  onChange({
                    ...config,
                    absoluteEncoder: {
                      ...config.absoluteEncoder,
                      channel: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
          )}

          {showEncoderFields && !usesChannel && (
            <div className="space-y-2">
              <Label>CAN Bus</Label>
              <Input
                value={config.absoluteEncoder.canbus}
                placeholder="Default"
                onChange={(e) =>
                  onChange({
                    ...config,
                    absoluteEncoder: {
                      ...config.absoluteEncoder,
                      canbus: e.target.value,
                    },
                  })
                }
              />
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 mt-4">
          <div className="space-y-2">
            <Label>Offset (degrees)</Label>
            <Input
              type="number"
              value={config.absoluteEncoderOffset}
              onChange={(e) =>
                onChange({
                  ...config,
                  absoluteEncoderOffset: Number(e.target.value),
                })
              }
            />
          </div>

          <div className="flex items-center space-x-2 pt-8">
            <Checkbox
              checked={config.absoluteEncoderInverted}
              onCheckedChange={(checked) =>
                onChange({
                  ...config,
                  absoluteEncoderInverted: checked as boolean,
                })
              }
            />
            <Label className="cursor-pointer">Invert Encoder</Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Motor Inversions */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Motor Inversions</h4>
        <div className="flex gap-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={config.inverted.drive}
              onCheckedChange={(checked) =>
                onChange({
                  ...config,
                  inverted: { ...config.inverted, drive: checked as boolean },
                })
              }
            />
            <Label className="cursor-pointer">Invert Drive</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              checked={config.inverted.angle}
              onCheckedChange={(checked) =>
                onChange({
                  ...config,
                  inverted: { ...config.inverted, angle: checked as boolean },
                })
              }
            />
            <Label className="cursor-pointer">Invert Angle</Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Gearing Override */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Gearing Override (Optional)</h4>
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox
            checked={!!config.gearing}
            onCheckedChange={(checked) =>
              onChange({
                ...config,
                gearing: checked
                  ? {
                      drive: { gearRatio: 0, diameter: 0 },
                      angle: { gearRatio: 0 },
                    }
                  : undefined,
              })
            }
          />
          <Label className="cursor-pointer">Override gearing from physicalproperties.json for this module</Label>
        </div>

        {config.gearing && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Drive Gear Ratio (X:1)</Label>
              <Input
                type="number"
                step="0.01"
                value={config.gearing.drive.gearRatio}
                onChange={(e) =>
                  onChange({
                    ...config,
                    gearing: {
                      ...config.gearing!,
                      drive: { ...config.gearing!.drive, gearRatio: Number(e.target.value) },
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Drive Wheel Diameter (inches)</Label>
              <Input
                type="number"
                step="0.01"
                value={config.gearing.drive.diameter}
                onChange={(e) =>
                  onChange({
                    ...config,
                    gearing: {
                      ...config.gearing!,
                      drive: { ...config.gearing!.drive, diameter: Number(e.target.value) },
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Angle Gear Ratio (X:1)</Label>
              <Input
                type="number"
                step="0.01"
                value={config.gearing.angle.gearRatio}
                onChange={(e) =>
                  onChange({
                    ...config,
                    gearing: {
                      ...config.gearing!,
                      angle: { ...config.gearing!.angle, gearRatio: Number(e.target.value) },
                    },
                  })
                }
              />
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Location */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Module Location (inches)</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Front</Label>
            <Input
              type="number"
              value={config.location.front}
              onChange={(e) =>
                onChange({
                  ...config,
                  location: { ...config.location, front: Number(e.target.value) },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Left</Label>
            <Input
              type="number"
              value={config.location.left}
              onChange={(e) =>
                onChange({
                  ...config,
                  location: { ...config.location, left: Number(e.target.value) },
                })
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
