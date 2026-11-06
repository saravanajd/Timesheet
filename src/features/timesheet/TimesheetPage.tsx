import DayView from './DayView'

interface TimesheetPageProps {
  uid: string
}

function TimesheetPage({ uid }: TimesheetPageProps) {
  return <DayView uid={uid} />
}

export default TimesheetPage
