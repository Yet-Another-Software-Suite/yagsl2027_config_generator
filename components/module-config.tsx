"use client"

import { Label } from "@/components/ui/label"
import { CanbusField } from "@/components/canbus-field"
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/ui/number-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import type { ModuleConfigData } from "@/lib/types"
import {
  MOTOR_CONTROLLERS,
  ENCODER_CONNECTIONS,
  encoderConnection,
  encoderName,
  encodersFor,
  switchEncoderConnection,
  motorControllerName,
  motorName,
  motorsFor,
  splitMotorType,
  attachedEncoderError,
  hasDataPort,
} from "@/lib/config-options"
import { selectAllOnFocus } from "@/lib/select-on-focus"

interface ModuleConfigProps {
  moduleName: string
  config: ModuleConfigData
  onChange: (config: ModuleConfigData) => void
}

export function ModuleConfig({ moduleName, config, onChange }: ModuleConfigProps) {
  const isAttached = config.absoluteEncoder.type.endsWith("_attached")
  const usesChannel = config.absoluteEncoder.type.endsWith("_dio") || config.absoluteEncoder.type.endsWith("_analog")
  const showEncoderFields = !isAttached
  const setEncoderType = (type: string) =>
    onChange({ ...config, absoluteEncoder: { ...config.absoluteEncoder, type: type as any } })
  const encoderError = attachedEncoderError(config.absoluteEncoder.type, config.angle.type)

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">{moduleName} Module</h3>

      {/* Drive Motor */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Drive Motor</h4>
        <div className="grid gap-4 md:grid-cols-4">
          <MotorTypeFields
            motorType={config.drive.type}
            onChange={(type) => onChange({ ...config, drive: { ...config.drive, type: type as any } })}
          />

          <div className="space-y-2">
            <Label>CAN ID</Label>
            <Input
              type="number"
              {...selectAllOnFocus}
              value={config.drive.id}
              onChange={(e) =>
                onChange({
                  ...config,
                  drive: { ...config.drive, id: Number(e.target.value) },
                })
              }
            />
          </div>

          <CanbusField
            deviceType={config.drive.type}
            canbus={config.drive.canbus}
            onChange={(canbus) => onChange({ ...config, drive: { ...config.drive, canbus } })}
          />
        </div>
      </div>

      <Separator />

      {/* Angle Motor */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Angle Motor</h4>
        <div className="grid gap-4 md:grid-cols-4">
          <MotorTypeFields
            motorType={config.angle.type}
            onChange={(type) => onChange({ ...config, angle: { ...config.angle, type: type as any } })}
          />

          <div className="space-y-2">
            <Label>CAN ID</Label>
            <Input
              type="number"
              {...selectAllOnFocus}
              value={config.angle.id}
              onChange={(e) =>
                onChange({
                  ...config,
                  angle: { ...config.angle, id: Number(e.target.value) },
                })
              }
            />
          </div>

          <CanbusField
            deviceType={config.angle.type}
            canbus={config.angle.canbus}
            onChange={(canbus) => onChange({ ...config, angle: { ...config.angle, canbus } })}
          />
        </div>
      </div>

      <Separator />

      {/* Absolute Encoder */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Absolute Encoder</h4>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Connection</Label>
            <Select
              value={encoderConnection(config.absoluteEncoder.type)}
              onValueChange={(connection) => setEncoderType(switchEncoderConnection(config.absoluteEncoder.type, connection))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENCODER_CONNECTIONS.map((connection) => (
                  <SelectItem
                    key={connection.id}
                    value={connection.id}
                    disabled={connection.id === "attached" && !hasDataPort(config.angle.type)}
                  >
                    {connection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Encoder</Label>
            <Select value={config.absoluteEncoder.type} onValueChange={setEncoderType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {encodersFor(encoderConnection(config.absoluteEncoder.type)).map((type) => (
                  <SelectItem key={type} value={type} disabled={attachedEncoderError(type, config.angle.type) !== null}>
                    {encoderName(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {encoderError && <p className="text-xs text-destructive">{encoderError}</p>}
          </div>

          {showEncoderFields && !usesChannel && (
            <div className="space-y-2">
              <Label>CAN ID</Label>
              <Input
                type="number"
                {...selectAllOnFocus}
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
            <CanbusField
              deviceType={config.absoluteEncoder.type}
              canbus={config.absoluteEncoder.canbus}
              onChange={(canbus) => onChange({ ...config, absoluteEncoder: { ...config.absoluteEncoder, canbus } })}
            />
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 mt-4">
          <div className="space-y-2">
            <Label>Offset (degrees)</Label>
            <NumberInput
              value={config.absoluteEncoderOffset}
              onValueChange={(absoluteEncoderOffset) => onChange({ ...config, absoluteEncoderOffset })}
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
            <NumberInput
              value={config.location.front}
              onValueChange={(front) => onChange({ ...config, location: { ...config.location, front } })}
            />
          </div>

          <div className="space-y-2">
            <Label>Left</Label>
            <NumberInput
              value={config.location.left}
              onValueChange={(left) => onChange({ ...config, location: { ...config.location, left } })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * The motor controller and motor dropdowns, which together make a YAGSL motor type ("sparkmax_neo"). Changing the
 * motor controller keeps the motor if the new one drives it, else picks its first motor.
 */
function MotorTypeFields({ motorType, onChange }: { motorType: string; onChange: (motorType: string) => void }) {
  const { controller, motor } = splitMotorType(motorType)
  const motors = motorsFor(controller)
  return (
    <>
      <div className="space-y-2">
        <Label>Motor Controller</Label>
        <Select
          value={controller}
          onValueChange={(next) => {
            const nextMotors = motorsFor(next)
            onChange(`${next}_${nextMotors.includes(motor) ? motor : nextMotors[0]}`)
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MOTOR_CONTROLLERS.map((c) => (
              <SelectItem key={c} value={c}>
                {motorControllerName(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Motor</Label>
        <Select value={motor} onValueChange={(next) => onChange(`${controller}_${next}`)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {motors.map((m) => (
              <SelectItem key={m} value={m}>
                {motorName(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  )
}
