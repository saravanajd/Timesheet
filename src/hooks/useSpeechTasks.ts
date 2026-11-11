import { useCallback, useEffect, useRef, useState } from 'react'
import { useToast } from './useToast'
import {
  getSpeechRecognitionConstructor,
  isSpeechRecognitionSupported,
  SpeechTaskSession,
} from '../lib/speech'

interface UseSpeechTasksOptions {
  language: string
  isOnline: boolean
  onPhrase: (phrase: string) => void
}

function getSpeechErrorMessage(error: string): string {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone permission is blocked'
    case 'no-speech':
      return "Didn't hear anything"
    case 'audio-capture':
      return 'No microphone found'
    case 'network':
    case 'service-unavailable':
      return 'Voice service unavailable'
    default:
      return 'Voice entry failed'
  }
}

export function useSpeechTasks({
  language,
  isOnline,
  onPhrase,
}: UseSpeechTasksOptions) {
  const { showError } = useToast()
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const onPhraseRef = useRef(onPhrase)
  const sessionRef = useRef<SpeechTaskSession | null>(null)
  const supported = isSpeechRecognitionSupported()

  useEffect(() => {
    onPhraseRef.current = onPhrase
  }, [onPhrase])

  const stopListening = useCallback(() => {
    sessionRef.current?.stop()
    sessionRef.current = null
  }, [])

  const startListening = useCallback(() => {
    const Recognition = getSpeechRecognitionConstructor()
    if (!Recognition || !isOnline) return

    sessionRef.current?.stop(false)
    try {
      const session = new SpeechTaskSession(
        language,
        {
          onListeningChange: setIsListening,
          onPhrase: (phrase) => onPhraseRef.current(phrase),
          onInterim: setInterimTranscript,
          onError: (error) => showError(getSpeechErrorMessage(error)),
        },
        Recognition,
      )
      sessionRef.current = session
      session.start()
    } catch (error: unknown) {
      setIsListening(false)
      setInterimTranscript('')
      showError(
        getSpeechErrorMessage(
          error instanceof Error ? error.name : 'service-unavailable',
        ),
      )
    }
  }, [isOnline, language, showError])

  const toggleListening = useCallback(() => {
    if (!supported || !isOnline) return
    if (sessionRef.current?.isActive) stopListening()
    else startListening()
  }, [isOnline, startListening, stopListening, supported])

  useEffect(() => {
    if (!isOnline || sessionRef.current?.language !== language) {
      stopListening()
    }
  }, [isOnline, language, stopListening])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        event.key.toLowerCase() === 'm' &&
        !event.repeat
      ) {
        event.preventDefault()
        toggleListening()
      } else if (event.key === 'Escape' && sessionRef.current) {
        event.preventDefault()
        stopListening()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [stopListening, toggleListening])

  useEffect(
    () => () => {
      sessionRef.current?.stop(false)
      sessionRef.current = null
    },
    [],
  )

  return {
    supported,
    isListening,
    interimTranscript,
    toggleListening,
    stopListening,
  }
}
