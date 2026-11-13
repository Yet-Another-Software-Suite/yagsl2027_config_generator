import type { FocusEvent, KeyboardEvent, MouseEvent } from "react"

/**
 * Props for an input whose whole value is selected when it gains focus, so typing replaces it.
 * Used for CAN IDs, which are nearly always changed outright rather than added to.
 *
 * A click focuses the input and then fires mouseup, which would collapse the selection to a caret,
 * so the mouseup that follows a focus is cancelled. Later clicks, or any once typing starts, place
 * the caret as usual.
 */
export const selectAllOnFocus = {
  onFocus: (e: FocusEvent<HTMLInputElement>) => {
    e.currentTarget.select()
    e.currentTarget.dataset.selectAllPending = "true"
  },
  onMouseUp: (e: MouseEvent<HTMLInputElement>) => {
    if (e.currentTarget.dataset.selectAllPending) {
      e.preventDefault()
      delete e.currentTarget.dataset.selectAllPending
    }
  },
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
    delete e.currentTarget.dataset.selectAllPending
  },
  onBlur: (e: FocusEvent<HTMLInputElement>) => {
    delete e.currentTarget.dataset.selectAllPending
  },
}
