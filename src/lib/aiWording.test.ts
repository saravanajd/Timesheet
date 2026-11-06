import { describe, expect, it } from 'vitest'
import {
  AIWordingRateLimitError,
  cleanModelOutput,
  getAIWordingErrorMessage,
  getRateLimitWait,
} from './aiWording'

describe('cleanModelOutput', () => {
  it('trims whitespace and surrounding quotes', () => {
    expect(cleanModelOutput('  "Reviewed monthly reports"  ')).toBe(
      'Reviewed monthly reports',
    )
  })

  it('removes markdown fences, list markers, and emphasis', () => {
    expect(cleanModelOutput('```text\n- **Reviewed monthly reports**\n```')).toBe(
      'Reviewed monthly reports',
    )
  })

  it('removes nested quotes and markdown formatting', () => {
    expect(cleanModelOutput('"**Reviewed monthly reports**"')).toBe(
      'Reviewed monthly reports',
    )
  })

  it('leaves normal punctuation and wording intact', () => {
    expect(cleanModelOutput('Reviewed reports, then filed them.')).toBe(
      'Reviewed reports, then filed them.',
    )
  })
})

describe('getRateLimitWait', () => {
  it('allows the first request and requests after the interval', () => {
    expect(getRateLimitWait(10_000, Number.NEGATIVE_INFINITY)).toBe(0)
    expect(getRateLimitWait(12_000, 10_000)).toBe(0)
  })

  it('returns the remaining delay before the interval', () => {
    expect(getRateLimitWait(11_250, 10_000)).toBe(750)
  })
})

describe('getAIWordingErrorMessage', () => {
  it('gives rate-limit and quota failures a friendly limit message', () => {
    expect(
      getAIWordingErrorMessage({
        code: 'ai/response-error',
        customData: { httpStatus: 429 },
      }),
    ).toBe('AI limit reached, try again later.')
  })

  it('shows connection guidance for network failures', () => {
    expect(getAIWordingErrorMessage(new TypeError('Network failed'))).toBe(
      'Could not reach AI wording. Check your connection and try again.',
    )
  })

  it('explains a temporary model overload without blaming configuration', () => {
    expect(
      getAIWordingErrorMessage(
        new Error(
          'AI: Error fetching: [500] This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.',
        ),
      ),
    ).toBe(
      'AI wording is temporarily busy. Your task was not changed; please try again later.',
    )
  })

  it('handles temporary service unavailability in SDK error details', () => {
    expect(
      getAIWordingErrorMessage({
        code: 'ai/fetch-error',
        customData: { httpStatus: 503 },
      }),
    ).toBe(
      'AI wording is temporarily busy. Your task was not changed; please try again later.',
    )
  })

  it('explains the local request interval', () => {
    expect(getAIWordingErrorMessage(new AIWordingRateLimitError())).toBe(
      'Please wait a moment before trying AI wording again.',
    )
  })
})
