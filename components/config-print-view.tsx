import type { ReactNode } from "react"
import type { ConfigData, ModuleConfigData } from "@/lib/types"
import { MOTOR_TYPES, ENCODER_TYPES, GYRO_TYPES, GYRO_AXES } from "@/lib/config-options"

// The interactive tabs (GyroConfig, ModuleConfig, PhysicalProperties, PIDFProperties) are
// intentionally NOT reused here. Printing them as-is would just reproduce the on-screen form
// controls, which is fine for a snapshot but not for a worksheet you can act on: dropdown
// options need to be visible without opening them, small fields need to be grouped so the
// sheet reads at a glance, and yes/no or handful-of-options fields need every choice printed
// so one can be circled by hand. What stays dynamic is the data: every value below is read
// straight from the live ConfigData, and the dropdown lists come from lib/config-options.ts -
// the same arrays the real dropdowns use - so this can never drift from what the app offers.

function ReferenceTable({ title, options }: { title: string; options: string[] }) {
  const columns = 3
  const rows: string[][] = []
  for (let i = 0; i < options.length; i += columns) {
    rows.push(options.slice(i, i + columns))
  }
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{title}</p>
      <table className="w-full border-collapse text-xs font-mono">
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((opt) => (
                <td key={opt} className="border border-border px-2 py-1">
                  {opt}
                </td>
              ))}
              {row.length < columns &&
                Array.from({ length: columns - row.length }).map((_, i) => (
                  <td key={`pad-${i}`} className="border border-border px-2 py-1" />
                ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// a handful of options, printed side by side - the current one is underlined+bold, the rest
// are left plain so a different one can be circled by hand instead
function ChoiceRow({ label, options, value }: { label: string; options: string[]; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5 text-sm">
      <span className="text-muted-foreground">{label}:</span>
      {options.map((opt) => (
        <span key={opt} className={opt === value ? "font-bold underline decoration-2 underline-offset-4" : "text-muted-foreground"}>
          {opt}
        </span>
      ))}
    </div>
  )
}

function BoolChoiceRow({ label, value }: { label: string; value: boolean }) {
  return <ChoiceRow label={label} options={["No", "Yes"]} value={value ? "Yes" : "No"} />
}

// a value that's currently just a fallback default (an empty "leave blank for default" field,
// an unset optional) - printed muted/plain instead of bold, same as it looks unfilled on screen
function orDefault(value: number | undefined, fallbackLabel: string): { value: ReactNode; muted: boolean } {
  return value === undefined ? { value: fallbackLabel, muted: true } : { value, muted: false }
}

function canbusField(canbus: string): { value: ReactNode; muted: boolean; writeIn: boolean } {
  return canbus ? { value: canbus, muted: false, writeIn: true } : { value: "(default)", muted: true, writeIn: true }
}

// several short numeric/text values grouped onto one line, with a blank after each one to
// write in a different value by hand
function InlineFields({
  fields,
  fullWidth,
}: {
  fields: { label: string; value: ReactNode; muted?: boolean }[]
  fullWidth?: boolean
}) {
  if (fullWidth) {
    // same fields, same line, but stretched so the row (and each field's write-in blank) spans the full page width
    return (
      <div className="grid text-sm" style={{ gridTemplateColumns: `repeat(${fields.length}, 1fr)`, columnGap: "1.5rem" }}>
        {fields.map((f, i) => (
          <span key={i} className="flex items-baseline gap-1.5">
            <span className="shrink-0 text-muted-foreground">{f.label}:</span>
            <span className={f.muted ? "shrink-0 italic text-muted-foreground" : "shrink-0 font-medium"}>{f.value}</span>
            <span className="inline-block flex-1 border-b border-foreground/30">&nbsp;</span>
          </span>
        ))}
      </div>
    )
  }
  return (
    <div className="flex flex-wrap gap-x-10 gap-y-3 text-sm">
      {fields.map((f, i) => (
        <span key={i} className="inline-flex items-baseline gap-1.5">
          <span className="text-muted-foreground">{f.label}:</span>
          <span className={f.muted ? "italic text-muted-foreground" : "font-medium"}>{f.value}</span>
          <span className="inline-block w-12 border-b border-foreground/30">&nbsp;</span>
        </span>
      ))}
    </div>
  )
}

// a value long enough (or important enough) to deserve its own full-width line. writeIn adds a
// blank about half the page wide, for CAN bus names and other free-text values worth rewriting by hand
function LongField({ label, value, muted, writeIn }: { label: string; value: ReactNode; muted?: boolean; writeIn?: boolean }) {
  return (
    <div className="flex items-baseline gap-1.5 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}:</span>
      <span className={muted ? "shrink-0 italic text-muted-foreground" : "shrink-0 font-medium"}>{value}</span>
      {writeIn && <span className="inline-block w-1/2 border-b border-foreground/30">&nbsp;</span>}
    </div>
  )
}

function Section({ title, file, children }: { title: string; file?: string; children: ReactNode }) {
  return (
    <section className="print-avoid-break mb-5 border-b border-border pb-4 last:border-b-0 last:pb-0">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-2">
        <h3 className="text-base font-semibold">{title}</h3>
        {file && <span className="text-xs font-mono text-muted-foreground">{file}</span>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function ModuleSection({ name, file, config }: { name: string; file: string; config: ModuleConfigData }) {
  const isAttached = config.absoluteEncoder.type.endsWith("_attached")
  const usesChannel = config.absoluteEncoder.type.endsWith("_dio") || config.absoluteEncoder.type.endsWith("_analog")

  return (
    <Section title={`${name} Module`} file={file}>
      <LongField label="Drive motor type" value={config.drive.type} writeIn />
      <LongField label="Angle motor type" value={config.angle.type} writeIn />
      <InlineFields
        fields={[
          { label: "Drive CAN ID", value: config.drive.id },
          { label: "Angle CAN ID", value: config.angle.id },
        ]}
      />
      <LongField label="Drive CAN bus" {...canbusField(config.drive.canbus)} />
      <LongField label="Angle CAN bus" {...canbusField(config.angle.canbus)} />

      <LongField label="Absolute encoder type" value={config.absoluteEncoder.type} writeIn />
      <InlineFields
        fields={(() => {
          const fields: { label: string; value: ReactNode }[] = []
          if (!isAttached && !usesChannel) fields.push({ label: "Encoder CAN ID", value: config.absoluteEncoder.id })
          if (usesChannel) fields.push({ label: "Encoder channel", value: config.absoluteEncoder.channel })
          fields.push({ label: "Offset (deg)", value: config.absoluteEncoderOffset })
          return fields
        })()}
      />
      {!isAttached && !usesChannel && <LongField label="Encoder CAN bus" {...canbusField(config.absoluteEncoder.canbus)} />}

      <BoolChoiceRow label="Invert encoder" value={config.absoluteEncoderInverted} />
      <div className="flex flex-wrap gap-x-10 gap-y-1.5">
        <BoolChoiceRow label="Invert drive" value={config.inverted.drive} />
        <BoolChoiceRow label="Invert angle" value={config.inverted.angle} />
      </div>

      {config.gearing ? (
        <InlineFields
          fields={[
            { label: "Drive gear ratio (X:1)", value: config.gearing.drive.gearRatio },
            { label: "Drive wheel diameter (in)", value: config.gearing.drive.diameter },
            { label: "Angle gear ratio (X:1)", value: config.gearing.angle.gearRatio },
          ]}
        />
      ) : (
        <LongField label="Gearing override" value="not set - uses physicalproperties.json" muted />
      )}

      <InlineFields
        fields={[
          { label: "Location front (in)", value: config.location.front },
          { label: "Location left (in)", value: config.location.left },
        ]}
      />
    </Section>
  )
}

export function ConfigPrintView({ config }: { config: ConfigData }) {
  return (
    <div className="text-foreground">
      <h2 className="text-lg font-bold mb-3">Swerve Drive Configuration</h2>

      <section className="print-avoid-break mb-5 border-b border-border pb-4">
        <h3 className="text-base font-semibold mb-2">Reference: Dropdown Options</h3>
        <div className="space-y-3">
          <ReferenceTable title="Motor Types" options={MOTOR_TYPES} />
          <ReferenceTable title="Absolute Encoder Types" options={ENCODER_TYPES} />
        </div>
      </section>

      <Section title="Gyroscope" file="swervedrive.json">
        <ChoiceRow label="Gyro type" options={GYRO_TYPES} value={config.swervedrive.gyro.type} />
        <InlineFields fields={[{ label: "CAN ID", value: config.swervedrive.gyro.id }]} />
        <LongField label="CAN bus" {...canbusField(config.swervedrive.gyro.canbus)} />
        <ChoiceRow label="Gyro axis" options={GYRO_AXES} value={config.swervedrive.gyroAxis} />
        <BoolChoiceRow label="Invert gyroscope" value={config.swervedrive.gyroInvert} />
      </Section>

      <ModuleSection name="Front Left" file="modules/frontleft.json" config={config.modules.frontleft} />
      <ModuleSection name="Front Right" file="modules/frontright.json" config={config.modules.frontright} />
      <ModuleSection name="Back Left" file="modules/backleft.json" config={config.modules.backleft} />
      <ModuleSection name="Back Right" file="modules/backright.json" config={config.modules.backright} />

      <Section title="Physical Properties" file="modules/physicalproperties.json">
        <InlineFields
          fields={[
            { label: "Drive gear ratio (X:1)", value: config.physicalproperties.gearing.drive.gearRatio },
            { label: "Drive wheel diameter (in)", value: config.physicalproperties.gearing.drive.diameter },
            { label: "Angle gear ratio (X:1)", value: config.physicalproperties.gearing.angle.gearRatio },
          ]}
        />
        <InlineFields
          fields={[
            { label: "Drive stator current limit (A)", ...orDefault(config.physicalproperties.statorCurrentLimit?.drive, "40 (default)") },
            { label: "Angle stator current limit (A)", ...orDefault(config.physicalproperties.statorCurrentLimit?.angle, "20 (default)") },
          ]}
        />
      </Section>

      <Section title="PID Properties" file="modules/pidfproperties.json (also written to pidfproperties_sim.json)">
        <InlineFields
          fullWidth
          fields={[
            { label: "Drive P", value: config.pidfproperties.drive.p },
            { label: "Drive I", value: config.pidfproperties.drive.i },
            { label: "Drive D", value: config.pidfproperties.drive.d },
          ]}
        />
        <InlineFields
          fullWidth
          fields={[
            { label: "Drive S", ...orDefault(config.pidfproperties.drive.s, "—") },
            { label: "Drive V", ...orDefault(config.pidfproperties.drive.v, "—") },
            { label: "Drive A", ...orDefault(config.pidfproperties.drive.a, "—") },
          ]}
        />
        <InlineFields
          fullWidth
          fields={[
            { label: "Angle P", value: config.pidfproperties.angle.p },
            { label: "Angle I", value: config.pidfproperties.angle.i },
            { label: "Angle D", value: config.pidfproperties.angle.d },
          ]}
        />
        <InlineFields
          fullWidth
          fields={[
            { label: "Angle S", ...orDefault(config.pidfproperties.angle.s, "—") },
            { label: "Angle V", ...orDefault(config.pidfproperties.angle.v, "—") },
            { label: "Angle A", ...orDefault(config.pidfproperties.angle.a, "—") },
          ]}
        />
      </Section>
    </div>
  )
}
