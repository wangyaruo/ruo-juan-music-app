import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Track } from '../types/track'
import { createMusicSource } from '../services/source'
import {
  clearLocalTracks,
  deleteLocalTrack,
  getLocalTracks,
  saveLocalTrack,
  updateLocalDuration,
} from '../services/localFiles'
import { parseLrc } from '../utils/lrc'
import type { LyricLine } from '../utils/lrc'

/** 播放模式：顺序 / 单曲循环 / 随机 */
export type PlayMode = 'sequence' | 'loop-one' | 'shuffle'

/** 从 localStorage 读取音量，非法值回退 0.8 */
function loadVolume(): number {
  const raw = localStorage.getItem('rj-volume')
  if (raw === null) return 0.8
  const n = Number(raw)
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.8
}

/**
 * 播放器核心 store。
 * 内部持有唯一的 HTMLAudioElement 实例，把音频事件同步为响应式状态；
 * 组件只读写这里暴露的状态与方法，不直接触碰 audio 元素。
 */
export const usePlayerStore = defineStore('player', () => {
  // ---------- 状态 ----------
  const queue = ref<Track[]>([])
  const currentIndex = ref(-1)
  const playing = ref(false)
  /** 网络缓冲中（用于播放按钮的 loading 态） */
  const loading = ref(false)
  /** 最近一次音频加载失败的提示文案（null 表示无错误） */
  const error = ref<string | null>(null)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(loadVolume())
  const playMode = ref<PlayMode>(
    localStorage.getItem('rj-playmode') === 'loop-one' ||
      localStorage.getItem('rj-playmode') === 'shuffle'
      ? (localStorage.getItem('rj-playmode') as PlayMode)
      : 'sequence',
  )
  /** 全屏播放页是否展开（UI 状态） */
  const npOpen = ref(false)
  /** 播放队列抽屉是否展开（UI 状态） */
  const queueOpen = ref(false)
  /** 静音状态（与音量值独立） */
  const muted = ref(false)
  /** 已缓冲进度（百分比） */
  const buffered = ref(0)
  /** 睡眠定时：到期时间戳（毫秒），null 为未开启 */
  const sleepAt = ref<number | null>(null)
  /** 最近播放（最多 20 条，新→旧，localStorage 持久化） */
  const recent = ref<Track[]>(JSON.parse(localStorage.getItem('rj-recent') ?? '[]') as Track[])
  /** 收藏的曲目 id 集合（localStorage 持久化） */
  const favorites = ref<Set<string>>(
    new Set(JSON.parse(localStorage.getItem('rj-favorites') ?? '[]') as string[]),
  )

  const currentTrack = computed<Track | null>(() =>
    currentIndex.value >= 0 && currentIndex.value < queue.value.length
      ? queue.value[currentIndex.value]
      : null,
  )

  // ---------- 歌词 ----------
  /** 当前曲目的歌词行（无歌词为空数组） */
  const lyricLines = computed<LyricLine[]>(() =>
    currentTrack.value?.lrc ? parseLrc(currentTrack.value.lrc) : [],
  )

  /** 当前播放位置对应的歌词行下标（第一句之前返回 -1，无歌词返回 -1） */
  const activeLyricIndex = computed(() => {
    const lines = lyricLines.value
    if (lines.length === 0) return -1
    const t = currentTime.value
    if (t < lines[0].time) return -1
    // 二分查找：最后一条 time <= t 的行
    let lo = 0
    let hi = lines.length - 1
    let ans = 0
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (lines[mid].time <= t) {
        ans = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    return ans
  })

  // ---------- 音频引擎（单例） ----------
  const audio = new Audio()
  audio.preload = 'metadata'
  audio.volume = volume.value

  audio.addEventListener('timeupdate', () => {
    currentTime.value = audio.currentTime
  })
  audio.addEventListener('durationchange', () => {
    duration.value = Number.isFinite(audio.duration) ? audio.duration : 0
  })
  audio.addEventListener('playing', () => {
    playing.value = true
    loading.value = false
    setPlaybackState('playing')
  })
  audio.addEventListener('pause', () => {
    playing.value = false
    setPlaybackState('paused')
  })
  audio.addEventListener('waiting', () => {
    loading.value = true
  })
  audio.addEventListener('progress', () => {
    if (audio.buffered.length > 0 && Number.isFinite(audio.duration) && audio.duration > 0) {
      buffered.value = (audio.buffered.end(audio.buffered.length - 1) / audio.duration) * 100
    }
  })
  audio.addEventListener('ended', onEnded)

  // ---------- 系统媒体控制（锁屏 / 控制中心，Media Session API） ----------
  function setPlaybackState(state: MediaSessionPlaybackState): void {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = state
    }
  }

  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => toggle())
    navigator.mediaSession.setActionHandler('pause', () => pause())
    navigator.mediaSession.setActionHandler('previoustrack', () => prev())
    navigator.mediaSession.setActionHandler('nexttrack', () => next())
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (typeof details.seekTime === 'number') seek(details.seekTime)
    })
  }
  audio.addEventListener('error', () => {
    loading.value = false
    playing.value = false
    error.value = currentTrack.value
      ? `《${currentTrack.value.title}》加载失败，请检查网络后重试`
      : '音频加载失败，请检查网络后重试'
  })

  // ---------- 动作 ----------
  /** 从当前音乐来源加载歌单；随后恢复 IndexedDB 中持久化的本地导入曲目 */
  async function loadQueue(): Promise<void> {
    const source = createMusicSource()
    queue.value = await source.getTracks()
    try {
      const locals = await getLocalTracks()
      for (const rec of locals) {
        queue.value.push({
          id: rec.id,
          title: rec.title,
          artist: rec.artist,
          url: URL.createObjectURL(rec.blob),
          duration: rec.duration,
          local: true,
        })
      }
    } catch {
      // IndexedDB 不可用（如隐私模式）时跳过本地恢复，不影响在线歌单
    }
  }

  /**
   * 导入本地音频文件：加入队列、持久化到 IndexedDB、异步读取时长。
   * 以「文件名+大小」为 id 去重；重复导入同一文件会被忽略。
   */
  function addLocalFiles(files: File[]): void {
    for (const file of files) {
      if (!file.type.startsWith('audio/')) continue
      const id = `local-${file.name}-${file.size}`
      if (queue.value.some((t) => t.id === id)) continue

      const track: Track = {
        id,
        title: file.name.replace(/\.[^.]+$/, ''),
        artist: '本地音乐',
        url: URL.createObjectURL(file),
        local: true,
      }
      queue.value.push(track)
      void saveLocalTrack({ id, title: track.title, artist: track.artist as string, blob: file })

      // 时长需读音频元数据，异步回填（队列与 IndexedDB 各一份）
      const probe = new Audio()
      probe.preload = 'metadata'
      probe.src = track.url
      probe.addEventListener(
        'loadedmetadata',
        () => {
          if (Number.isFinite(probe.duration)) {
            track.duration = probe.duration
            void updateLocalDuration(id, probe.duration)
          }
        },
        { once: true },
      )
    }
  }

  /** 播放队列中指定下标的曲目 */
  function playTrack(index: number): void {
    if (index < 0 || index >= queue.value.length) return
    currentIndex.value = index
    const track = queue.value[index]
    currentTime.value = 0
    duration.value = track.duration ?? 0
    buffered.value = 0
    error.value = null
    audio.src = track.url
    pushRecent(track)
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album ?? '',
      })
    }
    loading.value = true
    void audio.play().catch(() => {
      // 浏览器自动播放限制或加载失败时，回落到未播放状态
      playing.value = false
      loading.value = false
    })
  }

  /** 播放 / 暂停切换；未选曲时默认从第一首开始 */
  function toggle(): void {
    if (!currentTrack.value) {
      if (queue.value.length > 0) playTrack(0)
      return
    }
    if (playing.value) {
      audio.pause()
    } else {
      void audio.play().catch(() => {})
    }
  }

  /** 仅暂停（切换到演唱会等场景时避免与视频声音叠加） */
  function pause(): void {
    audio.pause()
  }

  function next(): void {
    step(1)
  }

  /** 上一首；若已播放超过 3 秒则先回到本曲开头（主流播放器惯例） */
  function prev(): void {
    if (audio.currentTime > 3) {
      seek(0)
      return
    }
    step(-1)
  }

  function seek(time: number): void {
    if (!currentTrack.value) return
    audio.currentTime = time
    currentTime.value = time
  }

  function setVolume(v: number): void {
    volume.value = Math.min(1, Math.max(0, v))
    audio.volume = volume.value
    // 拖动音量条视为解除静音
    if (muted.value) {
      muted.value = false
      audio.muted = false
    }
    localStorage.setItem('rj-volume', String(volume.value))
  }

  /** 静音切换（不改变音量值） */
  function toggleMute(): void {
    muted.value = !muted.value
    audio.muted = muted.value
  }

  /** 设置睡眠定时（分钟）；传 null 取消。到点自动暂停 */
  let sleepTimer: ReturnType<typeof setTimeout> | null = null

  function setSleepTimer(minutes: number | null): void {
    if (sleepTimer) {
      clearTimeout(sleepTimer)
      sleepTimer = null
    }
    if (minutes === null) {
      sleepAt.value = null
      return
    }
    sleepAt.value = Date.now() + minutes * 60_000
    sleepTimer = setTimeout(() => {
      pause()
      sleepAt.value = null
      sleepTimer = null
    }, minutes * 60_000)
  }

  /** 记录最近播放（去重、最多 20 条） */
  function pushRecent(track: Track): void {
    recent.value = [track, ...recent.value.filter((t) => t.id !== track.id)].slice(0, 20)
    localStorage.setItem('rj-recent', JSON.stringify(recent.value))
  }

  /** 循环切换播放模式：顺序 → 单曲 → 随机 → 顺序 */
  function cycleMode(): void {
    const order: PlayMode[] = ['sequence', 'loop-one', 'shuffle']
    playMode.value = order[(order.indexOf(playMode.value) + 1) % order.length]
    localStorage.setItem('rj-playmode', playMode.value)
  }

  function openNowPlaying(): void {
    npOpen.value = true
  }

  function closeNowPlaying(): void {
    npOpen.value = false
  }

  // ---------- 队列管理 ----------
  /** 从队列移除一曲；本地导入曲目联动删除 IndexedDB 记录并回收对象 URL */
  function removeFromQueue(index: number): void {
    if (index < 0 || index >= queue.value.length) return
    const wasCurrent = index === currentIndex.value
    const [removed] = queue.value.splice(index, 1)
    if (removed?.local) {
      URL.revokeObjectURL(removed.url)
      void deleteLocalTrack(removed.id)
    }
    if (wasCurrent) {
      if (queue.value.length === 0) {
        clearQueue()
      } else {
        playTrack(Math.min(index, queue.value.length - 1))
      }
    } else if (index < currentIndex.value) {
      currentIndex.value -= 1
    }
  }

  /** 清空队列并停止播放；同时清空本地导入的 IndexedDB 记录 */
  function clearQueue(): void {
    for (const t of queue.value) {
      if (t.local) URL.revokeObjectURL(t.url)
    }
    void clearLocalTracks()
    queue.value = []
    currentIndex.value = -1
    currentTime.value = 0
    duration.value = 0
    loading.value = false
    playing.value = false
    audio.pause()
    audio.removeAttribute('src')
  }

  /** 拖拽排序：把 from 位置的曲目移动到 to 位置，并修正 currentIndex */
  function moveInQueue(from: number, to: number): void {
    if (from === to || from < 0 || to < 0 || from >= queue.value.length || to >= queue.value.length)
      return
    const [item] = queue.value.splice(from, 1)
    queue.value.splice(to, 0, item)
    if (currentIndex.value === from) {
      currentIndex.value = to
    } else if (from < currentIndex.value && to >= currentIndex.value) {
      currentIndex.value -= 1
    } else if (from > currentIndex.value && to <= currentIndex.value) {
      currentIndex.value += 1
    }
  }

  function openQueue(): void {
    queueOpen.value = true
  }
  function isFavorite(id: string): boolean {
    return favorites.value.has(id)
  }

  function toggleFavorite(id: string): void {
    const next = new Set(favorites.value)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    favorites.value = next
    localStorage.setItem('rj-favorites', JSON.stringify([...next]))
  }

  // ---------- 内部 ----------
  function step(offset: number): void {
    if (queue.value.length === 0) return
    if (playMode.value === 'shuffle') {
      playTrack(randomIndex())
      return
    }
    const len = queue.value.length
    playTrack((currentIndex.value + offset + len) % len)
  }

  function randomIndex(): number {
    if (queue.value.length <= 1) return 0
    let i = currentIndex.value
    while (i === currentIndex.value) {
      i = Math.floor(Math.random() * queue.value.length)
    }
    return i
  }

  function onEnded(): void {
    if (playMode.value === 'loop-one') {
      seek(0)
      void audio.play().catch(() => {})
      return
    }
    // 顺序模式播完最后一首则停止，其余情况自动下一首
    if (playMode.value === 'sequence' && currentIndex.value === queue.value.length - 1) {
      playing.value = false
      return
    }
    step(1)
  }

  return {
    queue,
    currentIndex,
    playing,
    loading,
    error,
    currentTime,
    duration,
    volume,
    playMode,
    npOpen,
    queueOpen,
    muted,
    buffered,
    sleepAt,
    recent,
    favorites,
    currentTrack,
    lyricLines,
    activeLyricIndex,
    loadQueue,
    addLocalFiles,
    playTrack,
    toggle,
    pause,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    setSleepTimer,
    cycleMode,
    openNowPlaying,
    closeNowPlaying,
    isFavorite,
    toggleFavorite,
    removeFromQueue,
    clearQueue,
    moveInQueue,
    openQueue,
  }
})
