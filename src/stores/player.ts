import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Track } from '../types/track'
import { createMusicSource } from '../services/source'
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
  /** 从当前音乐来源加载歌单 */
  async function loadQueue(): Promise<void> {
    const source = createMusicSource()
    queue.value = await source.getTracks()
  }

  /** 播放队列中指定下标的曲目 */
  function playTrack(index: number): void {
    if (index < 0 || index >= queue.value.length) return
    currentIndex.value = index
    const track = queue.value[index]
    currentTime.value = 0
    duration.value = track.duration ?? 0
    error.value = null
    audio.src = track.url
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
    localStorage.setItem('rj-volume', String(volume.value))
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

  // ---------- 收藏 ----------
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
    favorites,
    currentTrack,
    lyricLines,
    activeLyricIndex,
    loadQueue,
    playTrack,
    toggle,
    pause,
    next,
    prev,
    seek,
    setVolume,
    cycleMode,
    openNowPlaying,
    closeNowPlaying,
    isFavorite,
    toggleFavorite,
  }
})
