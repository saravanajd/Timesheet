import { useCallback, useEffect, useRef } from 'react'
import { useDay } from '../../hooks/useDay'
import { useSpeechTasks } from '../../hooks/useSpeechTasks'
import { insertTranscriptTask } from '../../lib/speech'
import DayRow from './DayRow'
import type { DaysByKey } from '../../types'

interface DayContentProps {
  uid: string
  dayKey: string
  todayKey: string
  autoHours: number
  aiWordingEnabled: boolean
  voiceLanguage: string
  isOnline: boolean
  onDaysChange: (days: DaysByKey) => void
}

function DayContent({
  uid,
  dayKey,
  todayKey,
  autoHours,
  aiWordingEnabled,
  voiceLanguage,
  isOnline,
  onDaysChange,
}: DayContentProps) {
  const {
    tasks,
    hoursOverride,
    status,
    error,
    updateTasks,
    updateHoursOverride,
    saveNow,
  } = useDay(uid, dayKey)
  const tasksRef = useRef(tasks)
  const addVoiceTask = useCallback(
    (phrase: string) => {
      const nextTasks = insertTranscriptTask(tasksRef.current, phrase)
      tasksRef.current = nextTasks
      updateTasks(nextTasks)
      void saveNow()
    },
    [saveNow, updateTasks],
  )
  const {
    supported,
    isListening,
    interimTranscript,
    toggleListening,
  } = useSpeechTasks({
    language: voiceLanguage,
    isOnline,
    onPhrase: addVoiceTask,
  })
  const day = { tasks, hoursOverride }
  useEffect(() => {
    tasksRef.current = tasks
    onDaysChange({ [dayKey]: { tasks, hoursOverride } })
  }, [dayKey, tasks, hoursOverride, onDaysChange])

  return (
    <>
      {error && (
        <div className="timesheet-error" role="alert">
          {error}
        </div>
      )}
      <div className="timesheet-card">
        <DayRow
          uid={uid}
          autoFocusLastLine={status !== 'loading'}
          autoHours={autoHours}
          aiWordingEnabled={aiWordingEnabled}
          day={day}
          dayKey={dayKey}
          isOnline={isOnline}
          isToday={dayKey === todayKey}
          showMonth
          taskListFooter={
            supported && (
              <div className="timesheet-voice-controls">
                <button
                  aria-label={isListening ? 'Stop voice entry' : 'Start voice entry'}
                  aria-pressed={isListening}
                  className={`timesheet-mic-button${isListening ? ' is-listening' : ''}`}
                  disabled={!isOnline}
                  onClick={toggleListening}
                  title={
                    !isOnline
                      ? 'Voice entry needs an internet connection'
                      : isListening
                        ? 'Stop voice entry (Alt+M or Escape)'
                        : 'Start voice entry (Alt+M)'
                  }
                  type="button"
                >
                  <svg
                    aria-hidden="true"
                    fill="none"
                    height="18"
                    viewBox="0 0 24 24"
                    width="18"
                  >
                    <rect
                      height="12"
                      rx="4"
                      stroke="currentColor"
                      strokeWidth="2"
                      width="8"
                      x="8"
                      y="3"
                    />
                    <path
                      d="M5 11a7 7 0 0 0 14 0M12 18v3m-4 0h8"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="2"
                    />
                  </svg>
                </button>
                {isListening && (
                  <span
                    aria-live="polite"
                    className="timesheet-voice-preview"
                  >
                    {interimTranscript || 'Listening…'}
                  </span>
                )}
              </div>
            )
          }
          onBlur={() => {
            void saveNow()
          }}
          onDayChange={(nextDay) => {
            if (nextDay.tasks !== tasks) updateTasks(nextDay.tasks)
            if (nextDay.hoursOverride !== hoursOverride) {
              updateHoursOverride(nextDay.hoursOverride)
            }
          }}
          keepTrailingEmpty
        />
      </div>
      <div className="timesheet-save-status" aria-live="polite">
        {status === 'loading' ? 'Loading…' : status === 'saving' ? 'Saving…' : ''}
        {status === 'saved' ? 'Saved' : ''}
        {status === 'editing' ? 'Unsaved changes' : ''}
        {status === 'offline' ? 'Saved offline · will sync' : ''}
        {status === 'error' ? 'Save failed' : ''}
      </div>
    </>
  )
}

export default DayContent
