import { rangeTotals } from '../../lib/hours'
import { parseAutoHoursInput } from '../../lib/dayData'
import type { DaysByKey } from '../../types'
import type { SettingsStatus } from '../../hooks/useSettings'

interface SummaryBarProps {
  days: DaysByKey
  autoHours: number
  aiWordingEnabled: boolean
  voiceLanguage: string
  voiceSupported: boolean
  status: SettingsStatus
  onAutoHoursChange: (autoHours: number) => void
  onAiWordingChange: (enabled: boolean) => void
  onVoiceLanguageChange: (language: string) => void
}

const VOICE_LANGUAGES = [
  { value: 'en-IN', label: 'English (India)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'ta-IN', label: 'Tamil' },
  { value: 'hi-IN', label: 'Hindi' },
]

function formatHours(hours: number): string {
  return Number(hours.toFixed(2)).toString()
}

function SummaryBar({
  days,
  autoHours,
  aiWordingEnabled,
  voiceLanguage,
  voiceSupported,
  status,
  onAutoHoursChange,
  onAiWordingChange,
  onVoiceLanguageChange,
}: SummaryBarProps) {
  const { totalHours, daysWorked } = rangeTotals(days, autoHours)
  const hasVoiceLanguage = VOICE_LANGUAGES.some(
    (option) => option.value === voiceLanguage,
  )

  return (
    <div className="timesheet-summary">
      <span>
        Total <strong>{formatHours(totalHours)}</strong> h
      </span>
      <span>
        Days worked <strong>{daysWorked}</strong>
      </span>
      <label className="timesheet-ai-setting">
        <input
          checked={aiWordingEnabled}
          className="timesheet-ai-setting-checkbox"
          onChange={(event) => onAiWordingChange(event.currentTarget.checked)}
          type="checkbox"
        />
        Enable AI wording
      </label>
      <label className="timesheet-voice-setting">
        Voice language
        <select
          aria-label="Voice language"
          onChange={(event) =>
            onVoiceLanguageChange(event.currentTarget.value)
          }
          value={voiceLanguage}
        >
          {!hasVoiceLanguage && (
            <option value={voiceLanguage}>{voiceLanguage}</option>
          )}
          {VOICE_LANGUAGES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {!voiceSupported && (
          <small>Voice entry is not supported in this browser</small>
        )}
      </label>
      <label>
        Auto hours per day
        <input
          aria-label="Auto hours per day"
          defaultValue={autoHours}
          inputMode="decimal"
          key={autoHours}
          onBlur={(event) => {
            const nextHours = parseAutoHoursInput(event.currentTarget.value)
            if (nextHours !== null) onAutoHoursChange(nextHours)
            else event.currentTarget.value = String(autoHours)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
          }}
          type="text"
        />
        {status === 'saving' && <small>Saving…</small>}
      </label>
    </div>
  )
}

export default SummaryBar
