import { useEffect, useState } from 'react'

function getOnlineStatus(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine
}

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(getOnlineStatus)

  useEffect(() => {
    const updateStatus = () => setIsOnline(getOnlineStatus())
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)

    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  }, [])

  return isOnline
}
