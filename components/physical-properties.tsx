"use client"

import Link from "next/link"
import { Info, TriangleAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { PhysicalPropertiesConfig } from "@/lib/types"
import { type ModuleInversion, moduleInversion } from "@/lib/module-presets"
import { GearingInputs, ModulePresetSelects, useModulePreset } from "@/components/gearing-fields"

/** An inversion as the notice shows it: one the module type doesn't give is turned off, so it shows "Off". */
const onOff = (inverted: boolean | undefined) => (inverted ? "On" : "Off")

interface PhysicalPropertiesProps {
  config: PhysicalPropertiesConfig
  /** The picked inversions are passed along when the change is the user picking a module type or configuration. */
  onChange: (config: PhysicalPropertiesConfig, pickedInversion?: ModuleInversion) => void
}

export function PhysicalProperties({ config, onChange }: PhysicalPropertiesProps) {
  const preset = useModulePreset(config.gearing, (gearing, pickedInversion) =>
    onChange({ ...config, gearing }, pickedInversion),
  )
  const { moduleType, moduleConfiguration } = preset
  const inversion = moduleType && moduleInversion(moduleType, moduleConfiguration)

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Physical Properties</h3>

      {/* Module preset */}
      <div>
        <ModulePresetSelects preset={preset} idPrefix="properties" describedBy="module-type-description" />
        <div id="module-type-description" className="mt-2 max-w-prose space-y-3">
          <p className="text-sm text-muted-foreground">
            The module type fills in the wheel diameter and angle gear ratio below, and its configuration the drive gear
            ratio.
          </p>
          {moduleType && (
            <Alert role="status">
              {moduleType.inversion === undefined && !moduleConfiguration?.inversion ? <TriangleAlert /> : <Info />}
              <AlertTitle>
                {moduleType.inversion === undefined && !moduleConfiguration?.inversion
                  ? "Inversions not set automatically"
                  : "Inversions set automatically"}
              </AlertTitle>
              <AlertDescription>
                {inversion && (moduleType.inversion !== undefined || moduleConfiguration?.inversion) && (
                  <dl className="my-1 grid w-fit grid-cols-[auto_auto] gap-x-6 gap-y-0.5">
                    <dt>Invert Drive</dt>
                    <dd className="font-medium text-foreground">{onOff(inversion.driveMotor)}</dd>
                    <dt>Invert Angle</dt>
                    <dd className="font-medium text-foreground">{onOff(inversion.angleMotor)}</dd>
                    <dt>Invert Encoder</dt>
                    <dd className="font-medium text-foreground">{onOff(inversion.absoluteEncoder)}</dd>
                  </dl>
                )}
                <p>
                  {moduleType.inversion === undefined && !moduleConfiguration?.inversion
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

      <GearingInputs gearing={config.gearing} onChange={(gearing) => onChange({ ...config, gearing })} idPrefix="properties" />

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
