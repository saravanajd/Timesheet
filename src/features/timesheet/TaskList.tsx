import { useEffect, useLayoutEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { ensureTrailingEmptyTask } from '../../lib/dayData'

interface TaskListProps {
  tasks: string[]
  onTasksChange: (tasks: string[]) => void
  onBlur: () => void
  autoFocusLastLine: boolean
}

function TaskList({
  tasks,
  onTasksChange,
  onBlur,
  autoFocusLastLine,
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
    onTasksChange(ensureTrailingEmptyTask(nextTasks))
  }

  function deleteTask(index: number) {
    const nextTasks = [...tasks]
    nextTasks.splice(index, 1)
    updateTasks(nextTasks, Math.max(0, index - 1), true)
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
      if (!currentTask.trim()) return

      if (tasks[index + 1] !== undefined && !tasks[index + 1].trim()) {
        textareaRefs.current[index + 1]?.focus()
        return
      }

      const nextTasks = [...tasks]
      nextTasks.splice(index + 1, 0, '')
      updateTasks(nextTasks, index + 1)
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
      return
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const movingUp = event.key === 'ArrowUp'
      const atEdge = movingUp
        ? event.currentTarget.selectionStart === 0
        : event.currentTarget.selectionEnd === currentTask.length
      const nextIndex = index + (movingUp ? -1 : 1)

      if (atEdge && textareaRefs.current[nextIndex]) {
        event.preventDefault()
        textareaRefs.current[nextIndex]?.focus()
      }
    }
  }

  return (
    <div className="timesheet-tasks">
      {tasks.map((task, index) => (
        <div className="timesheet-task" key={index}>
          <textarea
            aria-label={`Task ${index + 1}`}
            onBlur={onBlur}
            onChange={(event) => {
              const nextTasks = [...tasks]
              nextTasks[index] = event.currentTarget.value
              updateTasks(nextTasks)
            }}
            onKeyDown={(event) => handleKeyDown(event, index)}
            placeholder={index === 0 ? 'Add task…' : undefined}
            ref={(textarea) => {
              textareaRefs.current[index] = textarea
            }}
            rows={1}
            value={task}
          />
          {task.trim() && (
            <button
              aria-label={`Delete task ${index + 1}`}
              className="timesheet-delete-task"
              onClick={() => deleteTask(index)}
              title="Delete task (Ctrl+Delete)"
              type="button"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

export default TaskList
