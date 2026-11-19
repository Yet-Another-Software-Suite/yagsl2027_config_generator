"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"

type NumberInputProps = Omit<React.ComponentProps<"input">, "type" | "value" | "onChange"> & {
  value: number
  onValueChange: (value: number) => void
}

/**
 * A number field that keeps what you've typed until it's a number, so you can start a value with
 * "-" or "." without it snapping back to 0.
 */
function NumberInput({ value, onValueChange, onBlur, ...props }: NumberInputProps) {
  const [text, setText] = React.useState(String(value))

  // Follow changes made elsewhere, such as uploading a config, unless they match what's typed.
  React.useEffect(() => {
    if (Number(text) !== value || text.trim() === "") setText(String(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <Input
      type="number"
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        const n = Number(e.target.value)
        if (e.target.value.trim() !== "" && Number.isFinite(n)) onValueChange(n)
      }}
      onBlur={(e) => {
        setText(String(value))
        onBlur?.(e)
      }}
      {...props}
    />
  )
}

export { NumberInput }
