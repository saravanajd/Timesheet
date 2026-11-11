import { ensureTrailingEmptyTask } from './dayData'

export interface SpeechRecognitionAlternativeLike {
  transcript: string
}

export interface SpeechRecognitionResultLike {
  readonly isFinal: boolean
  readonly length: number
  [index: number]: SpeechRecognitionAlternativeLike
}

export interface SpeechRecognitionEventLike {
  readonly resultIndex: number
  readonly results: ArrayLike<SpeechRecognitionResultLike>
}

export interface SpeechRecognitionErrorEventLike {
  readonly error: string
}

export interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  onend: (() => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onstart: (() => void) | null
  start: () => void
  stop: () => void
}

export interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike
}

interface SpeechWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

export interface SpeechTaskCallbacks {
  onListeningChange: (listening: boolean) => void
  onPhrase: (phrase: string) => void
  onInterim: (transcript: string) => void
  onError: (error: string) => void
}

const SILENCE_TIMEOUT_MS = 15_000
const MAX_CONSECUTIVE_RESTARTS = 3

export function cleanTranscript(text: string): string {
  const cleaned = text.trim().replace(/\s+/g, ' ').replace(/\.$/, '')
  if (!cleaned) return ''
  return cleaned[0].toUpperCase() + cleaned.slice(1)
}

export function insertTranscriptTask(
  tasks: readonly string[],
  transcript: string,
): string[] {
  const nextTasks = [...tasks]
  let lastNonEmptyIndex = -1
  for (let index = 0; index < nextTasks.length; index += 1) {
    if (nextTasks[index].trim()) lastNonEmptyIndex = index
  }
  nextTasks.splice(lastNonEmptyIndex + 1, 0, transcript)
  if (nextTasks[nextTasks.length - 1] !== '') nextTasks.push('')
  return ensureTrailingEmptyTask(nextTasks)
}

export function getSpeechRecognitionConstructor():
  | SpeechRecognitionConstructor
  | null {
  if (typeof window === 'undefined') return null
  const speechWindow = window as SpeechWindow
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null
}

export class SpeechTaskSession {
  readonly language: string
  private readonly recognition: SpeechRecognitionLike
  private readonly callbacks: SpeechTaskCallbacks
  private active = false
  private started = false
  private restartCount = 0
  private previousPhrase = ''
  private silenceTimer: ReturnType<typeof setTimeout> | null = null

  get isActive(): boolean {
    return this.active
  }

  constructor(
    language: string,
    callbacks: SpeechTaskCallbacks,
    Recognition: SpeechRecognitionConstructor,
  ) {
    this.language = language
    this.callbacks = callbacks
    this.recognition = new Recognition()
    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.lang = language
    this.recognition.onstart = () => this.resetSilenceTimer()
    this.recognition.onresult = (event) => this.handleResult(event)
    this.recognition.onerror = (event) => this.handleError(event.error)
    this.recognition.onend = () => this.handleEnd()
  }

  start(): void {
    if (this.active) return
    this.active = true
    this.callbacks.onListeningChange(true)
    this.resetSilenceTimer()
    this.startRecognition()
  }

  stop(reportErrors = true): void {
    if (!this.active) return
    this.active = false
    this.clearSilenceTimer()
    this.callbacks.onInterim('')
    this.callbacks.onListeningChange(false)

    if (!this.started) return
    this.started = false
    try {
      this.recognition.stop()
    } catch (stopError: unknown) {
      if (reportErrors) {
        this.callbacks.onError(
          stopError instanceof Error ? stopError.name : 'service-unavailable',
        )
      }
    }
  }

  private startRecognition(): void {
    this.started = true
    try {
      this.recognition.start()
      this.resetSilenceTimer()
    } catch (error: unknown) {
      this.started = false
      this.handleError(
        error instanceof Error ? error.name : 'service-unavailable',
      )
    }
  }

  private handleResult(event: SpeechRecognitionEventLike): void {
    if (!this.active) return
    this.restartCount = 0
    this.resetSilenceTimer()
    const interim: string[] = []

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index]
      if (!result || result.length === 0) continue
      const transcript = result[0]?.transcript ?? ''
      if (result.isFinal) {
        const phrase = cleanTranscript(transcript)
        if (phrase && phrase !== this.previousPhrase) {
          this.previousPhrase = phrase
          this.callbacks.onPhrase(phrase)
        }
      } else if (transcript.trim()) {
        interim.push(transcript.trim())
      }
    }

    this.callbacks.onInterim(interim.join(' '))
  }

  private handleError(error: string): void {
    if (!this.active) return
    this.active = false
    this.started = false
    this.clearSilenceTimer()
    this.callbacks.onInterim('')
    this.callbacks.onListeningChange(false)
    this.callbacks.onError(error)
  }

  private handleEnd(): void {
    this.started = false
    if (!this.active) return
    if (this.restartCount >= MAX_CONSECUTIVE_RESTARTS) {
      this.handleError('service-unavailable')
      return
    }
    this.restartCount += 1
    this.startRecognition()
  }

  private resetSilenceTimer(): void {
    this.clearSilenceTimer()
    if (!this.active) return
    this.silenceTimer = setTimeout(() => this.stop(), SILENCE_TIMEOUT_MS)
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer !== null) clearTimeout(this.silenceTimer)
    this.silenceTimer = null
  }
}
