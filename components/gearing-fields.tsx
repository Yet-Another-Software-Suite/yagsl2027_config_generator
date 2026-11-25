"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { PhysicalPropertiesConfig } from "@/lib/types"
import {
  type ModuleConfiguration,
  type ModuleInversion,
  type ModuleType,
  MODULE_TYPES,
  MODULE_VENDORS,
  findModuleType,
  fitsModuleConfiguration,
  fitsModuleType,
  matchModuleConfiguration,
  matchModuleType,
  moduleInversion,
} from "@/lib/module-presets"

export type Gearing = PhysicalPropertiesConfig["gearing"]

const CUSTOM = "custom"

/**
 * The module type and configuration whose gearing matches, and pickers that fill the gearing in from them. The picked
 * inversions are passed along when the change is picking a module type or configuration.
 */
export function useModulePreset(gearing: Gearing, onChange: (gearing: Gearing, pickedInversion?: ModuleInversion) => void) {
  const { drive, angle } = gearing
  // The module type picked last, while the values still fit it: MK4 and MK4c, for example, share their wheel and
  // angle gear ratio, so the values alone can't always tell them apart.
  const [pickedTypeId, setPickedTypeId] = useState<string>()
  const picked = findModuleType(pickedTypeId)
  const moduleType =
    picked && fitsModuleType(picked, drive.diameter, angle.gearRatio)
      ? picked
      : matchModuleType(drive.gearRatio, drive.diameter, angle.gearRatio)
  // Likewise the configuration picked last: the EasySwerve's motor mountings share a drive gear ratio.
  const [pickedConfigurationId, setPickedConfigurationId] = useState<string>()
  // The configuration of this module type picked last, if it still fits the drive gear ratio, else the one that does.
  const configurationFor = (type: ModuleType): ModuleConfiguration | undefined => {
    const pickedConfiguration = type.configurations.find((c) => c.id === pickedConfigurationId)
    return pickedConfiguration && fitsModuleConfiguration(pickedConfiguration, drive.gearRatio)
      ? pickedConfiguration
      : matchModuleConfiguration(type, drive.gearRatio)
  }
  const moduleConfiguration = moduleType && configurationFor(moduleType)

  const setGearing = (type: ModuleType, configuration: ModuleConfiguration) =>
    onChange(
      {
        ...gearing,
        drive: { ...drive, gearRatio: configuration.driveGearRatio, diameter: type.wheelDiameter },
        angle: { ...angle, gearRatio: type.angleGearRatio },
      },
      moduleInversion(type, configuration),
    )

  const pickModuleType = (id: string) => {
    const type = findModuleType(id)
    if (!type) return
    setPickedTypeId(id)
    // Keep the configuration if this module type has it, else start from its first one.
    const configuration = configurationFor(type) ?? type.configurations[0]
    setPickedConfigurationId(configuration.id)
    setGearing(type, configuration)
  }

  const pickModuleConfiguration = (id: string) => {
    const configuration = moduleType?.configurations.find((c) => c.id === id)
    if (!moduleType || !configuration) return
    setPickedConfigurationId(id)
    setGearing(moduleType, configuration)
  }

  return { moduleType, moduleConfiguration, pickModuleType, pickModuleConfiguration }
}

interface ModulePresetSelectsProps {
  preset: ReturnType<typeof useModulePreset>
  /** Prefix for the element ids, so more than one set of fields can be on the page. */
  idPrefix: string
  /** Id of the text that describes both pickers. */
  describedBy?: string
}

/** The Module Type and Module Configuration pickers. */
export function ModulePresetSelects({ preset, idPrefix, describedBy }: ModulePresetSelectsProps) {
  const { moduleType, moduleConfiguration, pickModuleType, pickModuleConfiguration } = preset
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-module-type`}>Module Type</Label>
        <Select value={moduleType?.id ?? CUSTOM} onValueChange={pickModuleType}>
          <SelectTrigger id={`${idPrefix}-module-type`} className="w-full" aria-describedby={describedBy}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CUSTOM} disabled>
              Custom
            </SelectItem>
            {MODULE_VENDORS.map((vendor) => (
              <SelectGroup key={vendor}>
                <SelectLabel>{vendor}</SelectLabel>
                {MODULE_TYPES.filter((type) => type.vendor === vendor).map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.vendor} {type.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-module-configuration`}>Module Configuration</Label>
        <Select value={moduleConfiguration?.id ?? CUSTOM} onValueChange={pickModuleConfiguration} disabled={!moduleType}>
          <SelectTrigger id={`${idPrefix}-module-configuration`} className="w-full" aria-describedby={describedBy}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CUSTOM} disabled>
              Custom
            </SelectItem>
            {moduleType?.configurations.map((configuration) => (
              <SelectItem key={configuration.id} value={configuration.id}>
                {configuration.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

interface GearingInputsProps {
  gearing: Gearing
  onChange: (gearing: Gearing) => void
  /** Prefix for the element ids, so more than one set of fields can be on the page. */
  idPrefix: string
}

/** The Drive Gearing and Angle Gearing number fields. */
export function GearingInputs({ gearing, onChange, idPrefix }: GearingInputsProps) {
  const setDrive = (drive: Partial<Gearing["drive"]>) => onChange({ ...gearing, drive: { ...gearing.drive, ...drive } })
  return (
    <>
      {/* Drive Gearing */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Drive Gearing</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-drive-gear-ratio`}>Gear Ratio (X:1)</Label>
            <Input
              id={`${idPrefix}-drive-gear-ratio`}
              type="number"
              step="0.01"
              value={gearing.drive.gearRatio}
              onChange={(e) => setDrive({ gearRatio: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-wheel-diameter`}>Wheel Diameter (inches)</Label>
            <Input
              id={`${idPrefix}-wheel-diameter`}
              aria-describedby={`${idPrefix}-wheel-diameter-description`}
              type="number"
              step="0.01"
              value={gearing.drive.diameter}
              onChange={(e) => setDrive({ diameter: Number(e.target.value) })}
            />
            <p id={`${idPrefix}-wheel-diameter-description`} className="text-sm text-muted-foreground">
              Measure your wheels: worn tread is smaller than the nominal diameter.
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Angle Gearing */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Angle Gearing</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-angle-gear-ratio`}>Gear Ratio (X:1)</Label>
            <Input
              id={`${idPrefix}-angle-gear-ratio`}
              type="number"
              step="0.01"
              value={gearing.angle.gearRatio}
              onChange={(e) => onChange({ ...gearing, angle: { ...gearing.angle, gearRatio: Number(e.target.value) } })}
            />
          </div>
        </div>
      </div>
    </>
  )
}
