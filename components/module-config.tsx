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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronRight } from "lucide-react"
import { type Gearing, GearingInputs, ModulePresetSelects, useModulePreset } from "@/components/gearing-fields"

interface ModuleConfigProps {
  moduleName: string
  config: ModuleConfigData
  /** The gearing from Physical Properties, which a gearing override starts from. */
  sharedGearing: Gearing
  onChange: (config: ModuleConfigData) => void
}

export function ModuleConfig({ moduleName, config, sharedGearing, onChange }: ModuleConfigProps) {
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

      <Separator />

      <AdvancedSection moduleName={moduleName} config={config} sharedGearing={sharedGearing} onChange={onChange} />
    </div>
  )
}

/**
 * Settings most robots leave alone, collapsed until opened: the gearing override for a module that isn't the same as
 * the others.
 */
function AdvancedSection({
  moduleName,
  config,
  sharedGearing,
  onChange,
}: {
  moduleName: string
  config: ModuleConfigData
  sharedGearing: Gearing
  onChange: (config: ModuleConfigData) => void
}) {
  const idPrefix = moduleName.toLowerCase().replace(/\s+/g, "-")
  const overridden = config.gearing !== undefined
  // Shows the override's module type and configuration; picking one here only changes this module's gearing, so the
  // inversions it would give are left alone.
  const preset = useModulePreset(config.gearing ?? sharedGearing, (gearing) => onChange({ ...config, gearing }))
  return (
    <Collapsible>
      <CollapsibleTrigger className="group flex w-full items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" aria-hidden="true" />
        Advanced
        {overridden && <span className="font-normal">(gearing overridden)</span>}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4 space-y-6">
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Gearing Override</h4>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${idPrefix}-gearing-override`}
              aria-describedby={`${idPrefix}-gearing-override-description`}
              checked={overridden}
              onCheckedChange={(checked) =>
                onChange({
                  ...config,
                  // Starts from the gearing in Physical Properties, so only what differs needs changing.
                  gearing: checked ? structuredClone(sharedGearing) : undefined,
                })
              }
            />
            <Label htmlFor={`${idPrefix}-gearing-override`} className="cursor-pointer">
              Use different gearing for this module
            </Label>
          </div>
          <p id={`${idPrefix}-gearing-override-description`} className="mt-2 max-w-prose text-sm text-muted-foreground">
            For a module that isn&apos;t the same as the others. This module uses this gearing in place of the one in
            Physical Properties. Picking a module type here doesn&apos;t change the inversions.
          </p>
        </div>

        {config.gearing && (
          <>
            <ModulePresetSelects preset={preset} idPrefix={idPrefix} />
            <GearingInputs
              gearing={config.gearing}
              onChange={(gearing) => onChange({ ...config, gearing })}
              idPrefix={idPrefix}
            />
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
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
