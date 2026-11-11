interface ContinueButtonProps {
  task: string
  onContinue: (task: string) => void
}

function ContinueButton({ task, onContinue }: ContinueButtonProps) {
  if (!task.trim()) return null

  return (
    <button
      aria-label="Continue task to next day"
      className="timesheet-continue-task"
      onClick={() => onContinue(task)}
      title="Continue to next day (Ctrl+Shift+Enter)"
      type="button"
    >
      ➜
    </button>
  )
}

export default ContinueButton
