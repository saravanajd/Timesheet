import { afterEach, describe, expect, it, vi } from 'vitest'
import { improveWording } from './aiWording'

const mocks = vi.hoisted(() => ({
  app: { name: 'test-app' },
  ai: { name: 'test-ai' },
  generateContent: vi.fn(),
  getAI: vi.fn(),
  getGenerativeModel: vi.fn(),
}))

vi.mock('./firebase', () => ({
  app: mocks.app,
  auth: { currentUser: { uid: 'test-user' } },
}))

vi.mock('firebase/ai', () => ({
  GoogleAIBackend: class GoogleAIBackend {},
  getAI: mocks.getAI,
  getGenerativeModel: mocks.getGenerativeModel,
}))

describe('improveWording SDK integration', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses Flash-Lite through the existing Firebase app and sends only the task', async () => {
    vi.stubGlobal('navigator', { onLine: true })
    mocks.getAI.mockReturnValue(mocks.ai)
    mocks.getGenerativeModel.mockReturnValue({
      generateContent: mocks.generateContent,
    })
    mocks.generateContent.mockResolvedValue({
      response: { text: () => ' "Reviewed reports." ' },
    })

    await expect(improveWording('review reports')).resolves.toBe(
      'Reviewed reports.',
    )
    expect(mocks.getAI).toHaveBeenCalledWith(
      mocks.app,
      { backend: expect.any(Object) },
    )
    expect(mocks.getGenerativeModel).toHaveBeenCalledWith(mocks.ai, {
      model: 'gemini-3.5-flash-lite',
      systemInstruction:
        'Rewrite the text as one clear, concise, professional timesheet task line in the same language. Keep the meaning, add no new details, and return only the rewritten text.',
      generationConfig: { maxOutputTokens: 100, temperature: 0.2 },
    })
    expect(mocks.generateContent).toHaveBeenCalledExactlyOnceWith(
      'review reports',
    )
  })
})
