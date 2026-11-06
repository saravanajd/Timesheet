import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDaySave } from './useDaySave'

const firestore = vi.hoisted(() => ({
  setDoc: vi.fn<() => Promise<void>>(),
  deleteDoc: vi.fn<() => Promise<void>>(),
}))

vi.mock('../lib/firebase', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  doc: (...segments: unknown[]) => segments.slice(1).join('/'),
  serverTimestamp: () => 'timestamp',
  setDoc: firestore.setDoc,
  deleteDoc: firestore.deleteDoc,
}))

let nextUser = 0

function createSaveHook() {
  const result: { current: ReturnType<typeof useDaySave> | null } = {
    current: null,
  }
  const uid = `test-user-${nextUser++}`
  function Harness() {
    result.current = useDaySave(uid)
    return null
  }
  renderToStaticMarkup(<Harness />)
  if (!result.current) throw new Error('Save hook did not render.')
  return result.current
}

describe('explicit entry saves', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    firestore.setDoc.mockReset().mockResolvedValue()
    firestore.deleteDoc.mockReset().mockResolvedValue()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not write while typing or after a long typing pause', async () => {
    const save = createSaveHook()
    save.stageDay('2026-11-06', { tasks: ['Task '], hoursOverride: null })
    await vi.advanceTimersByTimeAsync(10_000)
    save.stageDay('2026-11-06', { tasks: ['Task continued'], hoursOverride: null })
    await vi.advanceTimersByTimeAsync(10_000)

    expect(firestore.setDoc).not.toHaveBeenCalled()
    expect(firestore.deleteDoc).not.toHaveBeenCalled()

    await save.flushDay('2026-11-06')
    expect(firestore.setDoc).toHaveBeenCalledExactlyOnceWith(
      expect.any(String),
      {
        tasks: ['Task continued'],
        hoursOverride: null,
        updatedAt: 'timestamp',
      },
    )
  })

  it('does not submit a new draft when an earlier committed write finishes', async () => {
    const save = createSaveHook()
    let finishWrite: () => void = () => {
      throw new Error('No write is in flight.')
    }
    firestore.setDoc.mockImplementationOnce(
      () => new Promise<void>((resolve) => { finishWrite = resolve }),
    )
    save.stageDay('2026-11-06', { tasks: ['Committed task'], hoursOverride: null })
    const committed = save.flushDay('2026-11-06')
    save.stageDay('2026-11-06', { tasks: ['New draft '], hoursOverride: null })

    finishWrite()
    await committed
    await vi.advanceTimersByTimeAsync(10_000)
    expect(firestore.setDoc).toHaveBeenCalledTimes(1)

    await save.flushDay('2026-11-06')
    expect(firestore.setDoc).toHaveBeenCalledTimes(2)
    expect(firestore.setDoc).toHaveBeenLastCalledWith(
      expect.any(String),
      { tasks: ['New draft'], hoursOverride: null, updatedAt: 'timestamp' },
    )
  })

  it('commits only the selected day in a range', async () => {
    const save = createSaveHook()
    save.stageDay('2026-11-05', { tasks: ['First day'], hoursOverride: null })
    save.stageDay('2026-11-06', { tasks: ['Second day'], hoursOverride: null })
    await save.flushDay('2026-11-05')
    await vi.advanceTimersByTimeAsync(10_000)

    expect(firestore.setDoc).toHaveBeenCalledTimes(1)
    expect(firestore.setDoc).toHaveBeenLastCalledWith(
      expect.stringContaining('2026-11-05'),
      { tasks: ['First day'], hoursOverride: null, updatedAt: 'timestamp' },
    )
  })

  it('commits deletions only when explicitly submitted', async () => {
    const save = createSaveHook()
    save.stageDay('2026-11-06', { tasks: [''], hoursOverride: null })
    await vi.advanceTimersByTimeAsync(10_000)
    expect(firestore.deleteDoc).not.toHaveBeenCalled()

    await save.flushDay('2026-11-06')
    expect(firestore.deleteDoc).toHaveBeenCalledTimes(1)
  })
})
