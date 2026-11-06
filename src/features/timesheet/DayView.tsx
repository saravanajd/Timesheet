import type { DaysByKey } from '../../types'
import DayContent from './DayContent'

interface DayViewProps {
  uid: string
  dayKey: string
  todayKey: string
  autoHours: number
  onDaysChange: (days: DaysByKey) => void
}

function DayView({
  uid,
  dayKey,
  todayKey,
  autoHours,
  onDaysChange,
}: DayViewProps) {
  return (
    <section className="timesheet-view" aria-label="Day view">
      <DayContent
        autoHours={autoHours}
        dayKey={dayKey}
        key={dayKey}
        onDaysChange={onDaysChange}
        todayKey={todayKey}
        uid={uid}
      />
    </section>
  )
}

export default DayView
