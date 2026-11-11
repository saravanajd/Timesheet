import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { useTodos } from '../../hooks/useTodos'
import TodoItem from './TodoItem'

interface TodoPanelProps {
  uid: string
}

type TodoTab = 'pending' | 'completed'

function TodoPanel({ uid }: TodoPanelProps) {
  const [selectedTab, setSelectedTab] = useState<TodoTab>('pending')
  const [newText, setNewText] = useState('')
  const {
    pending,
    completed,
    loading,
    addTodo,
    updateTodoText,
    completeTodo,
    restoreTodo,
    deleteTodo,
  } = useTodos(uid)

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newText.trim()) return
    addTodo(newText)
    setNewText('')
  }

  function handleAddKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && !event.currentTarget.value.trim()) {
      event.preventDefault()
    }
  }

  return (
    <section aria-label="To do list" className="todo-panel">
      <h2>To do</h2>
      <div aria-label="To-do list tabs" className="todo-tabs" role="tablist">
        <button
          aria-selected={selectedTab === 'pending'}
          onClick={() => setSelectedTab('pending')}
          role="tab"
          type="button"
        >
          To do ({pending.length})
        </button>
        <button
          aria-selected={selectedTab === 'completed'}
          onClick={() => setSelectedTab('completed')}
          role="tab"
          type="button"
        >
          Completed ({completed.length})
        </button>
      </div>
      {selectedTab === 'pending' ? (
        <>
          {pending.length > 0 ? (
            <ul className="todo-list">
              {pending.map((todo) => (
                <TodoItem
                  completed={false}
                  key={todo.id}
                  onComplete={completeTodo}
                  onDelete={deleteTodo}
                  onRestore={restoreTodo}
                  onUpdateText={updateTodoText}
                  todo={todo}
                />
              ))}
            </ul>
          ) : (
            <p className="todo-empty">
              {loading ? 'Loading to-dos…' : 'Nothing to do'}
            </p>
          )}
          <form className="todo-add-form" onSubmit={handleAdd}>
            <input
              aria-label="Add a to-do"
              onChange={(event) => setNewText(event.currentTarget.value)}
              onKeyDown={handleAddKeyDown}
              placeholder="Add a to-do…"
              value={newText}
            />
          </form>
        </>
      ) : completed.length > 0 ? (
        <ul className="todo-list">
          {completed.map((todo) => (
            <TodoItem
              completed
              key={todo.id}
              onComplete={completeTodo}
              onDelete={deleteTodo}
              onRestore={restoreTodo}
              onUpdateText={updateTodoText}
              todo={todo}
            />
          ))}
        </ul>
      ) : (
        <p className="todo-empty">
          {loading
            ? 'Loading completed to-dos…'
            : 'No completed to-dos in the last 30 days'}
        </p>
      )}
    </section>
  )
}

export default TodoPanel
