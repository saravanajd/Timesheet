import { useRef, useState } from 'react'
import { parseHoursInput } from '../../lib/dayData'

interface HoursInputProps {
  displayHours: number
  hoursOverride: number | null
  onChange: (hoursOverride: number | null) => void
  onBlur: () => void
}

function formatHours(hours: number): string {
  return Number(hours.toFixed(2)).toString()
}

function HoursInput({
  displayHours,
  hoursOverride,
  onChange,
  onBlur,
}: HoursInputProps) {
  const [value, setValue] = useState('')
  const [editing, setEditing] = useState(false)
  const startingValueRef = useRef('')

  function commitValue() {
    if (value !== startingValueRef.current) {
      onChange(parseHoursInput(value))
    }
    setEditing(false)
    onBlur()
  }

  return (
    <div className="timesheet-hours">
      <input
        aria-label="Hours for this day"
        className={
          hoursOverride !== null
            ? 'is-override'
            : displayHours > 0
              ? 'has-hours'
              : ''
        }
        inputMode="decimal"
        onBlur={commitValue}
        onChange={(event) => setValue(event.currentTarget.value)}
        onFocus={(event) => {
          const currentValue =
            displayHours > 0 ? formatHours(displayHours) : ''
          startingValueRef.current = currentValue
          setValue(currentValue)
          setEditing(true)
          event.currentTarget.select()
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
        }}
        placeholder="–"
        type="text"
        value={
          editing
            ? value
            : displayHours > 0
              ? formatHours(displayHours)
              : ''
        }
      />
      <span>h</span>
    </div>
  )
}

export default HoursInput
