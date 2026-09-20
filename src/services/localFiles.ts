/**
 * 本地导入曲目的 IndexedDB 持久化（裸 API 封装，无第三方依赖）。
 *
 * 存储的是用户导入的音频文件 Blob 及元数据；页面刷新后从中恢复，
 * 用 URL.createObjectURL 重新生成播放地址。
 * 注意：IndexedDB 在隐私模式下可能不可用，调用方需自行兜底。
 */

export interface LocalTrackRecord {
  id: string
  title: string
  artist: string
  duration?: number
  blob: Blob
}

const DB_NAME = 'ruojuan-local'
const STORE = 'tracks'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function run<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = action(tx.objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    tx.onerror = () => reject(tx.error)
  })
}

export async function saveLocalTrack(rec: LocalTrackRecord): Promise<void> {
  const db = await openDB()
  await run(db, 'readwrite', (s) => s.put(rec))
}

export async function getLocalTracks(): Promise<LocalTrackRecord[]> {
  const db = await openDB()
  return run(db, 'readonly', (s) => s.getAll() as IDBRequest<LocalTrackRecord[]>)
}

export async function deleteLocalTrack(id: string): Promise<void> {
  const db = await openDB()
  await run(db, 'readwrite', (s) => s.delete(id))
}

export async function clearLocalTracks(): Promise<void> {
  const db = await openDB()
  await run(db, 'readwrite', (s) => s.clear())
}

/** 回填首次导入时异步读到的时长 */
export async function updateLocalDuration(id: string, duration: number): Promise<void> {
  const db = await openDB()
  const rec = await run(db, 'readonly', (s) => s.get(id) as IDBRequest<LocalTrackRecord | undefined>)
  if (rec) {
    await run(db, 'readwrite', (s) => s.put({ ...rec, duration }))
  }
}
