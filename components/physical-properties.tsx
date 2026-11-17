"use client"

import { useState } from "react"
import Link from "next/link"
import { Info, TriangleAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  type ModuleType,
  MODULE_TYPES,
  MODULE_VENDORS,
  findModuleType,
  fitsModuleType,
  matchModuleConfiguration,
  matchModuleType,
} from "@/lib/module-presets"

const CUSTOM = "custom"

/** An inversion as the notice shows it: one the module type doesn't give is turned off, so it shows "Off". */
const onOff = (inverted: boolean | undefined) => (inverted ? "On" : "Off")

interface PhysicalPropertiesProps {
  config: PhysicalPropertiesConfig
  /** The module type is passed along when the change is the user picking one. */
  onChange: (config: PhysicalPropertiesConfig, pickedModuleType?: ModuleType) => void
}

export function PhysicalProperties({ config, onChange }: PhysicalPropertiesProps) {
  const { drive, angle } = config.gearing
  // The module type picked last, while the values still fit it: MK4 and MK4c, for example, share their wheel and
  // angle gear ratio, so the values alone can't always tell them apart.
  const [pickedTypeId, setPickedTypeId] = useState<string>()
  const picked = findModuleType(pickedTypeId)
  const moduleType =
    picked && fitsModuleType(picked, drive.diameter, angle.gearRatio)
      ? picked
      : matchModuleType(drive.gearRatio, drive.diameter, angle.gearRatio)
  const moduleConfiguration = moduleType && matchModuleConfiguration(moduleType, drive.gearRatio)

  const setGearing = (
    driveGearRatio: number,
    wheelDiameter: number,
    angleGearRatio: number,
    pickedModuleType?: ModuleType,
  ) =>
    onChange(
      {
        ...config,
        gearing: {
          ...config.gearing,
          drive: { ...drive, gearRatio: driveGearRatio, diameter: wheelDiameter },
          angle: { ...angle, gearRatio: angleGearRatio },
        },
      },
      pickedModuleType,
    )

  const pickModuleType = (id: string) => {
    const type = findModuleType(id)
    if (!type) return
    setPickedTypeId(id)
    // Keep the drive gear ratio if it's one of this module's configurations, else start from its first one.
    const driveGearRatio = matchModuleConfiguration(type, drive.gearRatio)?.driveGearRatio
      ?? type.configurations[0].driveGearRatio
    setGearing(driveGearRatio, type.wheelDiameter, type.angleGearRatio, type)
  }

  const pickModuleConfiguration = (id: string) => {
    const configuration = moduleType?.configurations.find((c) => c.id === id)
    if (!moduleType || !configuration) return
    setGearing(configuration.driveGearRatio, moduleType.wheelDiameter, moduleType.angleGearRatio)
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Physical Properties</h3>

      {/* Module preset */}
      <div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="module-type">Module Type</Label>
            <Select value={moduleType?.id ?? CUSTOM} onValueChange={pickModuleType}>
              <SelectTrigger id="module-type" className="w-full" aria-describedby="module-type-description">
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
            <Label htmlFor="module-configuration">Module Configuration</Label>
            <Select
              value={moduleConfiguration?.id ?? CUSTOM}
              onValueChange={pickModuleConfiguration}
              disabled={!moduleType}
            >
              <SelectTrigger id="module-configuration" className="w-full" aria-describedby="module-type-description">
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
        <div id="module-type-description" className="mt-2 max-w-prose space-y-3">
          <p className="text-sm text-muted-foreground">
            The module type fills in the wheel diameter and angle gear ratio below, and its configuration the drive gear
            ratio.
          </p>
          {moduleType && (
            <Alert role="status">
              {moduleType.inversion === undefined ? <TriangleAlert /> : <Info />}
              <AlertTitle>
                {moduleType.inversion === undefined ? "Inversions not set automatically" : "Inversions set automatically"}
              </AlertTitle>
              <AlertDescription>
                {moduleType.inversion !== undefined && (
                  <dl className="my-1 grid w-fit grid-cols-[auto_auto] gap-x-6 gap-y-0.5">
                    <dt>Invert Drive</dt>
                    <dd className="font-medium text-foreground">{onOff(moduleType.inversion.driveMotor)}</dd>
                    <dt>Invert Angle</dt>
                    <dd className="font-medium text-foreground">{onOff(moduleType.inversion.angleMotor)}</dd>
                    <dt>Invert Encoder</dt>
                    <dd className="font-medium text-foreground">{onOff(moduleType.inversion.absoluteEncoder)}</dd>
                  </dl>
                )}
                <p>
                  {moduleType.inversion === undefined
                    ? "None are known for this module type, so Invert Drive, Invert Angle and Invert Encoder are turned off. Set them yourself, using the"
                    : "Applied to every module. Check them in the"}{" "}
                  {/* A new tab, since the form isn't saved anywhere and leaving the page would lose it. */}
                  <Link
                    href="/guide#align"
                    target="_blank"
                    rel="noopener"
                    className="text-foreground underline underline-offset-4"
                  >
                    Quick Start Guide&apos;s Align step
                    <span className="sr-only"> (opens in a new tab)</span>
                  </Link>
                  .
                </p>
              </AlertDescription>
            </Alert>
          )}
          {/* REV zeroes MAXSwerve and EasySwerve modules its own way, which isn't how YAGSL lines the wheels up. */}
          {moduleType?.vendor === "REV" && (
            <Alert variant="destructive">
              <TriangleAlert />
              <AlertTitle>Don&apos;t use REV&apos;s alignment tool or method</AlertTitle>
              <AlertDescription>
                <p>
                  Don&apos;t zero your {moduleType.name.split(",")[0]}{" "}modules with the alignment tool that comes with them, or with
                  REV&apos;s zeroing method. YAGSL needs every wheel facing forward with its bevel gear to the
                  robot&apos;s left, so line them up with the{" "}
                  <Link
                    href="/guide#align"
                    target="_blank"
                    rel="noopener"
                    className="text-foreground underline underline-offset-4"
                  >
                    Quick Start Guide&apos;s Align step
                    <span className="sr-only"> (opens in a new tab)</span>
                  </Link>{" "}
                  instead.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <Separator />

      {/* Drive Gearing */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Drive Gearing</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Gear Ratio (X:1)</Label>
            <Input
              type="number"
              step="0.01"
              value={config.gearing.drive.gearRatio}
              onChange={(e) =>
                onChange({
                  ...config,
                  gearing: {
                    ...config.gearing,
                    drive: {
                      ...config.gearing.drive,
                      gearRatio: Number(e.target.value),
                    },
                  },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wheel-diameter">Wheel Diameter (inches)</Label>
            <Input
              id="wheel-diameter"
              aria-describedby="wheel-diameter-description"
              type="number"
              step="0.01"
              value={config.gearing.drive.diameter}
              onChange={(e) =>
                onChange({
                  ...config,
                  gearing: {
                    ...config.gearing,
                    drive: {
                      ...config.gearing.drive,
                      diameter: Number(e.target.value),
                    },
                  },
                })
              }
            />
            <p id="wheel-diameter-description" className="text-sm text-muted-foreground">
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
            <Label>Gear Ratio (X:1)</Label>
            <Input
              type="number"
              step="0.01"
              value={config.gearing.angle.gearRatio}
              onChange={(e) =>
                onChange({
                  ...config,
                  gearing: {
                    ...config.gearing,
                    angle: {
                      ...config.gearing.angle,
                      gearRatio: Number(e.target.value),
                    },
                  },
                })
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Stator Current Limits */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Stator Current Limits (Optional)</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Drive Motor (A)</Label>
            <Input
              type="number"
              placeholder="40 (default)"
              value={config.statorCurrentLimit?.drive ?? ""}
              onChange={(e) =>
                onChange({
                  ...config,
                  statorCurrentLimit: {
                    ...config.statorCurrentLimit,
                    drive: e.target.value ? Number(e.target.value) : undefined,
                  },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Angle Motor (A)</Label>
            <Input
              type="number"
              placeholder="20 (default)"
              value={config.statorCurrentLimit?.angle ?? ""}
              onChange={(e) =>
                onChange({
                  ...config,
                  statorCurrentLimit: {
                    ...config.statorCurrentLimit,
                    angle: e.target.value ? Number(e.target.value) : undefined,
                  },
                })
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
