import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type {
  KeyboardEvent,
  MutableRefObject,
  ReactNode,
  Ref,
} from 'react'
import { useToast } from '../../hooks/useToast'
import {
  getAIWordingErrorMessage,
  improveWording,
} from '../../lib/aiWording'
import { ensureTrailingEmptyTask } from '../../lib/dayData'
import ContinueButton from './ContinueButton'

interface TaskListProps {
  tasks: string[]
  onTasksChange: (tasks: string[]) => void
  onBlur: () => void
  autoFocusLastLine: boolean
  aiWordingEnabled: boolean
  isOnline: boolean
  keepTrailingEmpty?: boolean
  placeholder?: string
  navigationRefs?: MutableRefObject<Array<HTMLTextAreaElement | null>>
  navigationOffset?: number
  footer?: ReactNode
  onContinueTask: (task: string) => void
}

interface TaskLineProps {
  task: string
  index: number
  placeholder?: string
  aiWordingEnabled: boolean
  isOnline: boolean
  textareaRef: Ref<HTMLTextAreaElement>
  focusTask: () => void
  onChange: (value: string) => void
  onDelete: () => void
  onContinueTask: (task: string) => void
  onBlur: () => void
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
}

function TaskLine({
  task,
  index,
  placeholder,
  aiWordingEnabled,
  isOnline,
  textareaRef,
  focusTask,
  onChange,
  onDelete,
  onContinueTask,
  onBlur,
  onKeyDown,
}: TaskLineProps) {
  const { showError } = useToast()
  const [suggestion, setSuggestion] = useState<{
    text: string
    sourceTask: string
  } | null>(null)
  const [runningTask, setRunningTask] = useState<string | null>(null)
  const isRunning = runningTask === task
  const visibleSuggestion =
    suggestion?.sourceTask === task ? suggestion.text : null
  const suggestionRef = useRef<HTMLDivElement>(null)
  const requestVersionRef = useRef(0)
  const previousTaskRef = useRef(task)
  const taskRef = useRef(task)
  const canShowSuggestionRef = useRef(aiWordingEnabled && isOnline)

  useEffect(() => {
    if (previousTaskRef.current !== task) {
      previousTaskRef.current = task
      taskRef.current = task
      requestVersionRef.current += 1
    }
    canShowSuggestionRef.current = aiWordingEnabled && isOnline
    if (!canShowSuggestionRef.current) {
      requestVersionRef.current += 1
    }
  }, [aiWordingEnabled, isOnline, task])

  useEffect(() => {
    if (visibleSuggestion) suggestionRef.current?.focus()
  }, [visibleSuggestion])

  async function requestImprovement() {
    if (!aiWordingEnabled || !isOnline || isRunning || !task.trim()) return

    setRunningTask(task)
    const requestVersion = requestVersionRef.current
    try {
      const improvedText = await improveWording(task)
      if (
        requestVersion === requestVersionRef.current &&
        taskRef.current === task &&
        canShowSuggestionRef.current
      ) {
        setSuggestion({ text: improvedText, sourceTask: task })
      }
    } catch (error: unknown) {
      showError(getAIWordingErrorMessage(error))
    } finally {
      setRunningTask((current) => (current === task ? null : current))
    }
  }

  function handleTaskKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.ctrlKey &&
      event.shiftKey &&
      event.key === 'Enter' &&
      task.trim()
    ) {
      event.preventDefault()
      onContinueTask(task)
      return
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'i') {
      event.preventDefault()
      void requestImprovement()
      return
    }
    onKeyDown(event)
  }

  function handleChange(value: string) {
    taskRef.current = value
    requestVersionRef.current += 1
    setSuggestion(null)
    onChange(value)
  }

  function acceptSuggestion() {
    if (!visibleSuggestion) return
    onChange(visibleSuggestion)
    onBlur()
    setSuggestion(null)
    focusTask()
  }

  function discardSuggestion() {
    setSuggestion(null)
    focusTask()
  }

  return (
    <div className="timesheet-task">
      <textarea
        aria-label={`Task ${index + 1}`}
        onBlur={onBlur}
        onChange={(event) => handleChange(event.currentTarget.value)}
        onKeyDown={handleTaskKeyDown}
        placeholder={index === 0 ? placeholder : undefined}
        ref={textareaRef}
        rows={1}
        value={task}
      />
      {task.trim() && (
        <div className="timesheet-task-actions">
          {aiWordingEnabled && isOnline ? (
            <button
              aria-label={`Improve wording for task ${index + 1}`}
              aria-busy={isRunning}
              className="timesheet-improve-task"
              disabled={isRunning}
              onClick={() => void requestImprovement()}
              title={isRunning ? 'Improving wording…' : 'Improve wording (Ctrl+I)'}
              type="button"
            >
              {isRunning ? '…' : '✨'}
            </button>
          ) : (
            <span aria-hidden="true" className="timesheet-task-action-spacer" />
          )}
          <ContinueButton onContinue={onContinueTask} task={task} />
          <button
            aria-label={`Delete task ${index + 1}`}
            className="timesheet-delete-task"
            onClick={onDelete}
            title="Delete task (Ctrl+Delete)"
            type="button"
          >
            ✕
          </button>
        </div>
      )}
      {visibleSuggestion && (
        <div
          aria-label={`Suggested wording for task ${index + 1}`}
          className="timesheet-ai-suggestion"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              discardSuggestion()
            } else if (
              event.key === 'Enter' &&
              event.target === event.currentTarget
            ) {
              event.preventDefault()
              acceptSuggestion()
            }
          }}
          ref={suggestionRef}
          role="group"
          tabIndex={0}
        >
          <p>{visibleSuggestion}</p>
          <div className="timesheet-ai-suggestion-actions">
            <button onClick={acceptSuggestion} type="button">
              Accept
            </button>
            <button onClick={discardSuggestion} type="button">
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TaskList({
  tasks,
  onTasksChange,
  onBlur,
  autoFocusLastLine,
  aiWordingEnabled,
  isOnline,
  keepTrailingEmpty = true,
  placeholder = 'Add task…',
  navigationRefs,
  navigationOffset = 0,
  footer,
  onContinueTask,
}: TaskListProps) {
  const textareaRefs = useRef<Array<HTMLTextAreaElement | null>>([])
  const pendingFocusRef = useRef<{ index: number; atEnd: boolean } | null>(null)
  const didInitialFocusRef = useRef(false)

  useLayoutEffect(() => {
    textareaRefs.current.forEach((textarea) => {
      if (!textarea) return
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    })

    const pendingFocus = pendingFocusRef.current
    if (pendingFocus) {
      const textarea = textareaRefs.current[pendingFocus.index]
      if (textarea) {
        textarea.focus()
        if (pendingFocus.atEnd) {
          textarea.setSelectionRange(
            textarea.value.length,
            textarea.value.length,
          )
        }
      }
      pendingFocusRef.current = null
    }
  }, [tasks])

  useEffect(() => {
    if (!autoFocusLastLine || didInitialFocusRef.current) return
    const lastTextarea = textareaRefs.current[tasks.length - 1]
    if (!lastTextarea) return
    didInitialFocusRef.current = true
    lastTextarea.focus()
  }, [autoFocusLastLine, tasks.length])

  function updateTasks(nextTasks: string[], focusIndex?: number, atEnd = false) {
    if (focusIndex !== undefined) {
      pendingFocusRef.current = { index: focusIndex, atEnd }
    }
    onTasksChange(
      keepTrailingEmpty ? ensureTrailingEmptyTask(nextTasks) : nextTasks,
    )
  }

  function deleteTask(index: number) {
    const nextTasks = [...tasks]
    nextTasks.splice(index, 1)
    updateTasks(nextTasks, Math.max(0, index - 1), true)
    onBlur()
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
    index: number,
  ) {
    const currentTask = tasks[index]

    if (
      (event.ctrlKey || event.metaKey) &&
      (event.key === 'Delete' ||
        (event.ctrlKey && event.shiftKey && event.key === 'Backspace'))
    ) {
      event.preventDefault()
      deleteTask(index)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      if (!currentTask.trim()) {
        onBlur()
        return
      }

      if (tasks[index + 1] !== undefined && !tasks[index + 1].trim()) {
        onBlur()
        textareaRefs.current[index + 1]?.focus()
        return
      }

      const nextTasks = [...tasks]
      nextTasks.splice(index + 1, 0, '')
      updateTasks(nextTasks, index + 1)
      onBlur()
      return
    }

    if (
      event.key === 'Backspace' &&
      !currentTask.trim() &&
      tasks.length > 1
    ) {
      event.preventDefault()
      const nextTasks = [...tasks]
      nextTasks.splice(index, 1)
      updateTasks(nextTasks, Math.max(0, index - 1), true)
      onBlur()
      return
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const movingUp = event.key === 'ArrowUp'
      const atEdge = movingUp
        ? event.currentTarget.selectionStart === 0
        : event.currentTarget.selectionEnd === currentTask.length
      const nextIndex = index + (movingUp ? -1 : 1)

      const target = navigationRefs
        ? navigationRefs.current[navigationOffset + nextIndex]
        : textareaRefs.current[nextIndex]
      if (atEdge && target) {
        event.preventDefault()
        target.focus()
      }
    }
  }

  return (
    <div className="timesheet-tasks">
      {tasks.map((task, index) => (
        <TaskLine
          aiWordingEnabled={aiWordingEnabled}
          index={index}
          isOnline={isOnline}
          key={index}
          onBlur={onBlur}
          onChange={(value) => {
            const nextTasks = [...tasks]
            nextTasks[index] = value
            updateTasks(nextTasks)
          }}
          onDelete={() => deleteTask(index)}
          onContinueTask={onContinueTask}
          onKeyDown={(event) => handleKeyDown(event, index)}
          focusTask={() => textareaRefs.current[index]?.focus()}
          placeholder={placeholder}
          task={task}
          textareaRef={(textarea) => {
            textareaRefs.current[index] = textarea
            if (navigationRefs) {
              navigationRefs.current[navigationOffset + index] = textarea
            }
          }}
        />
      ))}
      {footer}
    </div>
  )
}

export default TaskList
