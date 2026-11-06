import { useEffect, useRef, useState } from 'react'
import type { DaysByKey } from '../../types'
import { buildCopyText, copyTitleForView } from '../../lib/copyText'
import { exportMonthExcel } from '../../lib/exportExcel'
import type { AllowedWindow } from '../../lib/workday'
import type { TimesheetViewType } from './RangeNav'

interface CopyExportActionsProps {
  view: TimesheetViewType
  dayKey: string
  uid: string
  days: DaysByKey
  autoHours: number
  window: AllowedWindow
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unexpected error occurred.'
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    return
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      if (!document.execCommand('copy')) {
        throw new Error('Clipboard copy was rejected by the browser.')
      }
    } finally {
      textarea.remove()
    }
  }
}

function CopyExportActions({
  view,
  dayKey,
  uid,
  days,
  autoHours,
  window,
}: CopyExportActionsProps) {
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const monthKey = `${dayKey.slice(0, 7)}-01`

  useEffect(
    () => () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    },
    [],
  )

  async function handleCopy() {
    setError(null)
    const text = buildCopyText(
      copyTitleForView(view, dayKey),
      days,
      autoHours,
    )
    try {
      await copyText(text)
      setCopied(true)
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => setCopied(false), 1500)
    } catch (copyError: unknown) {
      setError(getErrorMessage(copyError))
    }
  }

  async function handleExport() {
    setError(null)
    setExporting(true)
    try {
      await exportMonthExcel(uid, monthKey, autoHours, window)
    } catch (exportError: unknown) {
      setError(getErrorMessage(exportError))
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <div className="timesheet-actions">
        <button className="is-primary" onClick={handleCopy} type="button">
          {copied ? 'Copied ✓' : `Copy ${view}`}
        </button>
        {view !== 'day' && (
          <button
            disabled={exporting}
            onClick={handleExport}
            type="button"
          >
            {exporting ? 'Exporting…' : 'Export Excel'}
          </button>
        )}
      </div>
      {error && (
        <div className="timesheet-error" role="alert">
          {error}
        </div>
      )}
    </>
  )
}

export default CopyExportActions
