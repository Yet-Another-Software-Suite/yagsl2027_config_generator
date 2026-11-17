"use client"

import { useId, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { canPortNameNumber, canbusError, isCTRE } from "@/lib/config-options"

// The select's value for the CANivore option. Bus numbers are digits, so it can't clash with one.
const CANIVORE = "canivore"
const DEFAULT = "default"

// YAGSL's canbus values: empty for can_s0, "1" to "4" for can_s1 to can_s4, and "5" to "24" for the Motioncore buses
// can_d0 to can_d19, or those buses' CANPort names, such as "CAN_S1". Anything else names a CANivore, which only CTRE
// devices take. Picking a bus here saves its number; a name already in an uploaded config is kept until another is picked.
const SYSTEMCORE = [1, 2, 3, 4].map((n) => ({ value: String(n), label: `CAN_S${n}` }))
const MOTIONCORE = Array.from({ length: 20 }, (_, n) => ({ value: String(n + 5), label: `CAN_D${n}` }))

const isBusNumber = (canbus: string) => /^\d+$/.test(canbus.trim()) || canPortNameNumber(canbus) !== undefined

/** A device's CAN bus: a dropdown of the Systemcore and Motioncore buses, and a CANivore name for CTRE devices. */
export function CanbusField({
  id,
  deviceType,
  canbus,
  onChange,
}: {
  id?: string
  deviceType: string
  canbus: string
  onChange: (canbus: string) => void
}) {
  const generatedId = useId()
  const selectId = id ?? `canbus-${generatedId}`
  // Picking CANivore before typing its name leaves canbus empty, so the choice is remembered here until then.
  const [canivorePicked, setCanivorePicked] = useState(false)
  const value = canbus.trim()
  const canivore = (value !== "" && !isBusNumber(value)) || (canivorePicked && value === "")
  const bus = canPortNameNumber(value) ?? value
  const selected = canivore ? CANIVORE : bus === "" || bus === "0" ? DEFAULT : bus
  const error = canbusError(deviceType, canbus)
  const ctre = isCTRE(deviceType)

  return (
    <div className="space-y-2">
      <Label htmlFor={selectId}>CAN Bus</Label>
      <Select
        value={selected}
        onValueChange={(picked) => {
          setCanivorePicked(picked === CANIVORE)
          if (picked === CANIVORE) onChange(canivore ? canbus : "")
          else onChange(picked === DEFAULT ? "" : picked)
        }}
      >
        <SelectTrigger id={selectId} className="w-full" aria-invalid={error ? true : undefined}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Systemcore</SelectLabel>
            <SelectItem value={DEFAULT}>CAN_S0 (default)</SelectItem>
            {SYSTEMCORE.map((bus) => (
              <SelectItem key={bus.value} value={bus.value}>
                {bus.label}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Motioncore</SelectLabel>
            {MOTIONCORE.map((bus) => (
              <SelectItem key={bus.value} value={bus.value}>
                {bus.label}
              </SelectItem>
            ))}
          </SelectGroup>
          {(ctre || canivore) && (
            <SelectGroup>
              <SelectLabel>CTRE</SelectLabel>
              <SelectItem value={CANIVORE}>CANivore</SelectItem>
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
      {canivore && (
        <Input
          aria-label="CANivore name"
          value={canbus}
          placeholder="CANivore name"
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
