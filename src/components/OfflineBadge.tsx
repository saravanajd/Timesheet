import { useOnlineStatus } from '../hooks/useOnlineStatus'

function OfflineBadge() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <span className="timesheet-offline-badge" role="status">
      Offline · changes will sync
    </span>
  )
}

export default OfflineBadge
