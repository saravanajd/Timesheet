import { app, auth } from './firebase'

const MODEL_NAME = 'gemini-3.5-flash-lite'
const SYSTEM_INSTRUCTION =
  'Rewrite the text as one clear, concise, professional timesheet task line in the same language. Keep the meaning, add no new details, and return only the rewritten text.'
const REQUEST_INTERVAL_MS = 2000

let lastRequestAt = Number.NEGATIVE_INFINITY

export function getRateLimitWait(
  now: number,
  lastRequest: number,
  interval = REQUEST_INTERVAL_MS,
): number {
  return Math.max(0, interval - (now - lastRequest))
}

export function cleanModelOutput(output: string): string {
  let cleaned = output
    .trim()
    .replace(/^```(?:[a-zA-Z0-9_-]+)?\s*\r?\n?/, '')
    .replace(/\r?\n?```$/, '')
    .trim()

  for (let pass = 0; pass < 3; pass += 1) {
    cleaned = cleaned
      .replace(/^>\s*/, '')
      .replace(/^#{1,6}\s+/, '')
      .replace(/^(?:[-*+]|\d+[.)])\s+/, '')
      .replace(/^(\*\*|__|~~|`)([\s\S]*)\1$/, '$2')
      .replace(/^("|'|“|‘)([\s\S]*)(?:"|'|”|’)$/, '$2')
      .trim()
  }

  return cleaned
}

export class AIWordingRateLimitError extends Error {
  constructor() {
    super('AI wording can be requested once every two seconds.')
    this.name = 'AIWordingRateLimitError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function getAIWordingErrorMessage(error: unknown): string {
  const details: string[] = []
  if (error instanceof Error) details.push(error.message)

  if (isRecord(error)) {
    if (typeof error.code === 'string') details.push(error.code)
    if (isRecord(error.customData)) {
      for (const key of ['status', 'httpStatus', 'message', 'serverResponse']) {
        const detail = error.customData[key]
        if (typeof detail === 'string' || typeof detail === 'number') {
          details.push(String(detail))
        }
      }
    }
  }

  const message = details.join(' ').toLowerCase()
  if (/429|quota|resource[_ -]?exhausted|rate.?limit/.test(message)) {
    return 'AI limit reached, try again later.'
  }
  if (/high demand|overload|503|unavailable/.test(message)) {
    return 'AI wording is temporarily busy. Your task was not changed; please try again later.'
  }
  if (
    error instanceof TypeError ||
    /network|fetch|offline|connection|internet|timed? ?out/.test(message)
  ) {
    return 'Could not reach AI wording. Check your connection and try again.'
  }
  if (error instanceof AIWordingRateLimitError) {
    return 'Please wait a moment before trying AI wording again.'
  }
  return 'Could not improve wording. Your task was not changed; please try again.'
}

export async function improveWording(text: string): Promise<string> {
  if (!auth?.currentUser) {
    throw new Error('Sign in to use AI wording.')
  }
  if (!app) {
    throw new Error('Firebase is unavailable.')
  }
  if (!text.trim()) {
    throw new Error('Enter a task before requesting an improvement.')
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new TypeError('Network is offline.')
  }

  const now = Date.now()
  if (getRateLimitWait(now, lastRequestAt) > 0) {
    throw new AIWordingRateLimitError()
  }
  lastRequestAt = now

  const { getAI, GoogleAIBackend, getGenerativeModel } = await import(
    'firebase/ai'
  )
  const ai = getAI(app, { backend: new GoogleAIBackend() })
  const model = getGenerativeModel(ai, {
    model: MODEL_NAME,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: { maxOutputTokens: 100, temperature: 0.2 },
  })
  const result = await model.generateContent(text)
  const suggestion = cleanModelOutput(result.response.text())
  if (!suggestion) {
    throw new Error('The AI returned an empty suggestion.')
  }
  return suggestion
}
