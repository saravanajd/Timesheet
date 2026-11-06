export type SnapshotSaveStatus = 'loading' | 'saving' | 'saved' | 'offline'

interface SnapshotMetadata {
  hasPendingWrites: boolean
  fromCache: boolean
}

export function getSnapshotSaveStatus(
  metadata: SnapshotMetadata,
  isOnline: boolean,
): SnapshotSaveStatus {
  if (metadata.hasPendingWrites) {
    return isOnline && !metadata.fromCache ? 'saving' : 'offline'
  }

  return metadata.fromCache ? 'loading' : 'saved'
}
