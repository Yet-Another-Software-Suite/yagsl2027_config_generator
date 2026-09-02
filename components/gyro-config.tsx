"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { SwervedriveConfig } from "@/lib/types"
import { GYRO_TYPES, GYRO_AXES } from "@/lib/config-options"

interface GyroConfigProps {
  config: SwervedriveConfig
  onChange: (config: SwervedriveConfig) => void
}

export function GyroConfig({ config, onChange }: GyroConfigProps) {
  const isCustom = config.gyro.type === "custom"

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Gyroscope Configuration</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="gyro-type">Gyro Type</Label>
            <Select
              value={config.gyro.type}
              onValueChange={(value) =>
                onChange({
                  ...config,
                  gyro: { ...config.gyro, type: value as any },
                })
              }
            >
              <SelectTrigger id="gyro-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GYRO_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isCustom && (
            <>
              <div className="space-y-2">
                <Label htmlFor="gyro-id">CAN ID</Label>
                <Input
                  id="gyro-id"
                  type="number"
                  value={config.gyro.id}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      gyro: { ...config.gyro, id: Number(e.target.value) },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gyro-canbus">CAN Bus Name</Label>
                <Input
                  id="gyro-canbus"
                  value={config.gyro.canbus}
                  placeholder="Leave empty for default"
                  onChange={(e) =>
                    onChange({
                      ...config,
                      gyro: { ...config.gyro, canbus: e.target.value },
                    })
                  }
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="gyro-axis">Gyro Axis</Label>
            <Select value={config.gyroAxis} onValueChange={(value) => onChange({ ...config, gyroAxis: value as any })}>
              <SelectTrigger id="gyro-axis">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GYRO_AXES.map((axis) => (
                  <SelectItem key={axis} value={axis}>
                    {axis}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 pt-8">
            <Checkbox
              id="gyro-invert"
              checked={config.gyroInvert}
              onCheckedChange={(checked) => onChange({ ...config, gyroInvert: checked as boolean })}
              disabled={isCustom}
            />
            <Label htmlFor="gyro-invert" className={isCustom ? "text-muted-foreground" : "cursor-pointer"}>
              Invert Gyroscope
            </Label>
          </div>
        </div>

        {isCustom && (
          <div className="mt-4 space-y-2 rounded-lg border p-3 text-sm">
            <p>
              <strong>Custom gyro:</strong> use this when your gyro isn't one of the built-in options above. The{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">Gyro Axis</code> and{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">Invert Gyroscope</code> fields above
              are ignored for a custom gyro, YAGSL doesn't build a gyro device for you in this case.
            </p>
            <p>
              Instead, read your gyro yourself and pass it (and its inversion, if any) to the{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">SwerveDriveConfig</code> you build in
              code, before handing it to{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                SwerveParser.createSwerveDrive(...)
              </code>
              /
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">createSwerveDriveDevices(...)</code>:
            </p>
            <pre className="overflow-x-auto rounded bg-muted p-2.5 text-xs leading-relaxed">
              <code className="font-mono">
                {[
                  "var cfg = new SwerveDriveConfig()",
                  "    .withSubsystem(this)",
                  "    .withGyro(() -> myCustomGyro.getYaw())",
                  "    .withGyroInverted(true)",
                  "    // .withGyroOffset(...), .withGyroVelocity(...) are also available",
                  "    .withTranslationController(new PIDController(4, 0, 0))",
                  "    .withRotationController(new PIDController(1, 0, 0))",
                  '    .withTelemetry("swerve", new SwerveDriveTelemetryConfig(TelemetryVerbosity.HIGH));',
                ].map((line, i) => (
                  <div key={i}>{line || " "}</div>
                ))}
              </code>
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
