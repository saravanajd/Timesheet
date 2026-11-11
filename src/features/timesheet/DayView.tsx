import type { DaysByKey } from '../../types'
import DayContent from './DayContent'

interface DayViewProps {
  uid: string
  dayKey: string
  todayKey: string
  autoHours: number
  aiWordingEnabled: boolean
  voiceLanguage: string
  isOnline: boolean
  onDaysChange: (days: DaysByKey) => void
}

function DayView({
  uid,
  dayKey,
  todayKey,
  autoHours,
  aiWordingEnabled,
  voiceLanguage,
  isOnline,
  onDaysChange,
}: DayViewProps) {
  return (
    <section className="timesheet-view" aria-label="Day view">
      <DayContent
        autoHours={autoHours}
        aiWordingEnabled={aiWordingEnabled}
        voiceLanguage={voiceLanguage}
        dayKey={dayKey}
        isOnline={isOnline}
        key={dayKey}
        onDaysChange={onDaysChange}
        todayKey={todayKey}
        uid={uid}
      />
    </section>
  )
}

export default DayView
