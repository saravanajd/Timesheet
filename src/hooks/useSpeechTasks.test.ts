import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cleanTranscript,
  insertTranscriptTask,
  SpeechTaskSession,
  type SpeechRecognitionEventLike,
  type SpeechRecognitionLike,
  type SpeechTaskCallbacks,
} from '../lib/speech'

const recognitions: MockSpeechRecognition[] = []

class MockSpeechRecognition implements SpeechRecognitionLike {
  continuous = false
  interimResults = false
  lang = ''
  onend: (() => void) | null = null
  onerror: ((event: { error: string }) => void) | null = null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null = null
  onstart: (() => void) | null = null
  startCalls = 0
  stopCalls = 0

  constructor() {
    recognitions.push(this)
  }

  start() {
    this.startCalls += 1
    this.onstart?.()
  }

  stop() {
    this.stopCalls += 1
    this.onend?.()
  }

  emitResult(transcript: string, isFinal: boolean) {
    this.onresult?.({
      resultIndex: 0,
      results: [
        {
          isFinal,
          length: 1,
          0: { transcript },
        },
      ],
    })
  }

  emitError(error: string) {
    this.onerror?.({ error })
  }
}

function createSession(callbacks: Partial<SpeechTaskCallbacks> = {}) {
  const session = new SpeechTaskSession(
    'en-IN',
    {
      onListeningChange: callbacks.onListeningChange ?? vi.fn(),
      onPhrase: callbacks.onPhrase ?? vi.fn(),
      onInterim: callbacks.onInterim ?? vi.fn(),
      onError: callbacks.onError ?? vi.fn(),
    },
    MockSpeechRecognition,
  )
  session.start()
  return { session, recognition: recognitions.at(-1)! }
}

afterEach(() => {
  recognitions.length = 0
  vi.useRealTimers()
})

describe('cleanTranscript', () => {
  it('trims and collapses whitespace, removes a final period, and capitalises', () => {
    expect(cleanTranscript('  prepare   monthly report.  ')).toBe(
      'Prepare monthly report',
    )
    expect(cleanTranscript('')).toBe('')
    expect(cleanTranscript('.')).toBe('')
  })
})

describe('useSpeechTasks recognition session', () => {
  it('adds final phrases as tasks but only previews interim text', () => {
    let tasks = ['Typed task', '']
    const interim = vi.fn()
    const { recognition } = createSession({
      onPhrase: (phrase) => {
        tasks = insertTranscriptTask(tasks, phrase)
      },
      onInterim: interim,
    })

    recognition.emitResult('write the release notes', false)
    expect(tasks).toEqual(['Typed task', ''])
    expect(interim).toHaveBeenLastCalledWith('write the release notes')

    recognition.emitResult('write the release notes.', true)
    expect(tasks).toEqual(['Typed task', 'Write the release notes', ''])
  })

  it('ignores a duplicate of the previous final phrase', () => {
    const onPhrase = vi.fn()
    const { recognition } = createSession({ onPhrase })

    recognition.emitResult('send the invoice.', true)
    recognition.emitResult('send the invoice', true)

    expect(onPhrase).toHaveBeenCalledExactlyOnceWith('Send the invoice')
  })

  it('stops after fifteen seconds without recognition results', () => {
    vi.useFakeTimers()
    const onListeningChange = vi.fn()
    const { recognition } = createSession({ onListeningChange })

    vi.advanceTimersByTime(15_000)

    expect(recognition.stopCalls).toBe(1)
    expect(onListeningChange).toHaveBeenLastCalledWith(false)
  })

  it('does not add a final result delivered after listening has stopped', () => {
    const onPhrase = vi.fn()
    const { session, recognition } = createSession({ onPhrase })

    session.stop()
    recognition.emitResult('do not save this', true)

    expect(onPhrase).not.toHaveBeenCalled()
  })

  it('resets listening state and reports a recognition error', () => {
    const onListeningChange = vi.fn()
    const onError = vi.fn()
    const onInterim = vi.fn()
    const { recognition } = createSession({
      onListeningChange,
      onError,
      onInterim,
    })

    recognition.emitResult('unfinished phrase', false)
    recognition.emitError('network')

    expect(onListeningChange).toHaveBeenLastCalledWith(false)
    expect(onInterim).toHaveBeenLastCalledWith('')
    expect(onError).toHaveBeenCalledExactlyOnceWith('network')
  })

  it('restarts an ended recognition session no more than three times', () => {
    const onError = vi.fn()
    const { recognition } = createSession({ onError })

    recognition.onend?.()
    recognition.onend?.()
    recognition.onend?.()
    expect(recognition.startCalls).toBe(4)

    recognition.onend?.()
    expect(onError).toHaveBeenCalledExactlyOnceWith('service-unavailable')
  })
})
