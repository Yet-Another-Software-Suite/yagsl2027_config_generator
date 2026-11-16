"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TriangleAlert } from "lucide-react"
import type { SwervedriveConfig } from "@/lib/types"
import {
  GYRO_AXES,
  GYRO_CONNECTIONS,
  canbusError,
  canbusPlaceholder,
  USB_PORTS,
  gyroConnection,
  gyroName,
  gyrosFor,
} from "@/lib/config-options"
import { selectAllOnFocus } from "@/lib/select-on-focus"

interface GyroConfigProps {
  config: SwervedriveConfig
  onChange: (config: SwervedriveConfig) => void
}

export function GyroConfig({ config, onChange }: GyroConfigProps) {
  const isCustom = config.gyro.type === "custom"
  // A USB gyro's channel is its USB port; other gyros don't have one.
  const setGyroType = (type: string) => {
    const { channel, ...gyro } = config.gyro
    onChange({
      ...config,
      gyro: gyroConnection(type) === "usb" ? { ...gyro, type, channel: channel ?? 0 } : { ...gyro, type },
    })
  }
  // Internal gyros (e.g. the Systemcore's onboard IMU) aren't on CAN, so YAGSL ignores the ID and bus.
  const usesUsb = gyroConnection(config.gyro.type) === "usb"
  const usesCan = !isCustom && !usesUsb && !config.gyro.type.endsWith("_internal")
  const gyroCanbusError = canbusError(config.gyro.type, config.gyro.canbus)
  // Recommend calibrating the gyro when its heading is read from another axis.
  const offYaw = !isCustom && config.gyroAxis !== "yaw"

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Gyroscope Configuration</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="gyro-connection">Connection</Label>
            <Select
              value={gyroConnection(config.gyro.type)}
              // A connection's first gyro: the CAN, SystemCore and Custom lists don't share any.
              onValueChange={(connection) => setGyroType(gyrosFor(connection)[0])}
            >
              <SelectTrigger id="gyro-connection" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GYRO_CONNECTIONS.map((connection) => (
                  <SelectItem key={connection.id} value={connection.id}>
                    {connection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gyro-type">Gyro</Label>
            <Select value={config.gyro.type} onValueChange={setGyroType}>
              <SelectTrigger id="gyro-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {gyrosFor(gyroConnection(config.gyro.type)).map((type) => (
                  <SelectItem key={type} value={type}>
                    {gyroName(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {usesUsb && (
            <div className="space-y-2">
              <Label htmlFor="gyro-usb-port">USB Port</Label>
              <Select
                value={String(config.gyro.channel ?? 0)}
                onValueChange={(port) => onChange({ ...config, gyro: { ...config.gyro, channel: Number(port) } })}
              >
                <SelectTrigger id="gyro-usb-port" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USB_PORTS.map((port) => (
                    <SelectItem key={port} value={String(port)}>
                      USB{port}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {usesCan && (
            <>
              <div className="space-y-2">
                <Label htmlFor="gyro-id">CAN ID</Label>
                <Input
                  id="gyro-id"
                  type="number"
                  {...selectAllOnFocus}
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
                <Label htmlFor="gyro-canbus">CAN Bus</Label>
                <Input
                  id="gyro-canbus"
                  value={config.gyro.canbus}
                  placeholder={canbusPlaceholder(config.gyro.type)}
                  aria-invalid={gyroCanbusError ? true : undefined}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      gyro: { ...config.gyro, canbus: e.target.value },
                    })
                  }
                />
                {gyroCanbusError && <p className="text-xs text-destructive">{gyroCanbusError}</p>}
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

        {offYaw && (
          <Alert className="mt-4">
            <TriangleAlert />
            <AlertTitle>Calibrate your gyro</AlertTitle>
            <AlertDescription>
              <p>
                When using the <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs">{config.gyroAxis}</code>{" "}
                axis, we recommend calibrating your gyro with its vendor&apos;s tool.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {isCustom && (
          <div className="mt-4 space-y-2 rounded-lg border p-3 text-sm">
            <p>
              <strong>Custom gyro:</strong> use this when your gyro isn't one of the built-in options above. The{" "}
              <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs">Gyro Axis</code> and{" "}
              <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs">Invert Gyroscope</code> fields above
              are ignored for a custom gyro, YAGSL doesn't build a gyro device for you in this case.
            </p>
            <p>
              Instead, read your gyro yourself and pass its full attitude as a{" "}
              <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs">Rotation3d</code> (and its inversion,
              if any) to the{" "}
              <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs">SwerveDriveConfig</code> you build in
              code, before handing it to{" "}
              <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs">
                SwerveParser.createSwerveDrive(...)
              </code>
              /
              <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs">createSwerveDriveDevices(...)</code>:
            </p>
            <pre className="overflow-x-auto rounded-sm bg-muted p-2.5 text-xs leading-relaxed">
              <code className="font-mono">
                {[
                  "// import swervelib.commands2.SwerveParser; (swervelib.commands3.SwerveParser for Commands v3)",
                  "var cfg = new SwerveDriveConfig()",
                  "    .withSubsystem(this) // .withMechanism(this) for Commands v3",
                  "    // The gyro's attitude: its yaw is the robot's heading, its roll and pitch feed anti-tipping.",
                  "    .withGyro(myCustomGyro::getRotation3d)",
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
