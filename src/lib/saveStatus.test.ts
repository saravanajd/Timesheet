import { describe, expect, it } from 'vitest'
import { getSnapshotSaveStatus } from './saveStatus'

describe('getSnapshotSaveStatus', () => {
  it('marks server-confirmed snapshots as saved', () => {
    expect(
      getSnapshotSaveStatus(
        { hasPendingWrites: false, fromCache: false },
        true,
      ),
    ).toBe('saved')
  })

  it('marks server-backed pending writes as saving while online', () => {
    expect(
      getSnapshotSaveStatus(
        { hasPendingWrites: true, fromCache: false },
        true,
      ),
    ).toBe('saving')
  })

  it('marks queued writes as offline', () => {
    expect(
      getSnapshotSaveStatus(
        { hasPendingWrites: true, fromCache: true },
        false,
      ),
    ).toBe('offline')
  })

  it('uses cache metadata to identify queued writes when the browser reports online', () => {
    expect(
      getSnapshotSaveStatus(
        { hasPendingWrites: true, fromCache: true },
        true,
      ),
    ).toBe('offline')
  })

  it('does not claim cached data is server-confirmed', () => {
    expect(
      getSnapshotSaveStatus(
        { hasPendingWrites: false, fromCache: true },
        false,
      ),
    ).toBe('loading')
  })
})
