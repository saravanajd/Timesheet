import { useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { format } from 'date-fns'
import type { Todo } from '../../lib/todos'

interface TodoItemProps {
  todo: Todo
  completed: boolean
  onComplete: (id: string) => void
  onRestore: (id: string) => void
  onDelete: (id: string) => void
  onUpdateText: (id: string, text: string) => void
}

function TodoItem({
  todo,
  completed,
  onComplete,
  onRestore,
  onDelete,
  onUpdateText,
}: TodoItemProps) {
  const [text, setText] = useState(todo.text)
  const textRef = useRef(todo.text)
  const dirtyRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [text])

  function commitText() {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    if (!dirtyRef.current) return
    dirtyRef.current = false
    onUpdateText(todo.id, textRef.current)
  }

  function changeText(value: string) {
    textRef.current = value
    dirtyRef.current = true
    setText(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(commitText, 600)
  }

  function deleteThisTodo() {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    dirtyRef.current = false
    onDelete(todo.id)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === 'Delete'
    ) {
      event.preventDefault()
      deleteThisTodo()
    } else if (event.key === 'Backspace' && !textRef.current.trim()) {
      event.preventDefault()
      deleteThisTodo()
    }
  }

  return (
    <li className={`todo-item${completed ? ' is-completed' : ''}`}>
      <button
        aria-checked={completed}
        aria-label={completed ? 'Restore to-do' : 'Complete to-do'}
        className="todo-check"
        onClick={() =>
          completed ? onRestore(todo.id) : onComplete(todo.id)
        }
        role="checkbox"
        type="button"
      >
        {completed ? '✓' : ''}
      </button>
      {completed ? (
        <div className="todo-completed-text">
          <span>{todo.text}</span>
          {todo.doneAt && (
            <small>Done {format(todo.doneAt.toDate(), 'MMM d')}</small>
          )}
        </div>
      ) : (
        <textarea
          aria-label="To-do text"
          onBlur={commitText}
          onChange={(event) => changeText(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
          ref={textareaRef}
          rows={1}
          value={text}
        />
      )}
      <button
        aria-label="Delete to-do"
        className="todo-delete"
        onClick={deleteThisTodo}
        title="Delete to-do (Ctrl+Delete)"
        type="button"
      >
        ✕
      </button>
    </li>
  )
}

export default TodoItem
