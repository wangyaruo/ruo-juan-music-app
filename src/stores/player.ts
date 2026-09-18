import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Track } from '../types/track'
import { createMusicSource } from '../services/source'

/** 播放模式：顺序 / 单曲循环 / 随机 */
export type PlayMode = 'sequence' | 'loop-one' | 'shuffle'

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
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(0.8)
  const playMode = ref<PlayMode>('sequence')

  const currentTrack = computed<Track | null>(() =>
    currentIndex.value >= 0 && currentIndex.value < queue.value.length
      ? queue.value[currentIndex.value]
      : null,
  )

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
  })
  audio.addEventListener('pause', () => {
    playing.value = false
  })
  audio.addEventListener('waiting', () => {
    loading.value = true
  })
  audio.addEventListener('ended', onEnded)

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
    audio.src = track.url
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
  }

  /** 循环切换播放模式：顺序 → 单曲 → 随机 → 顺序 */
  function cycleMode(): void {
    const order: PlayMode[] = ['sequence', 'loop-one', 'shuffle']
    playMode.value = order[(order.indexOf(playMode.value) + 1) % order.length]
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
    currentTime,
    duration,
    volume,
    playMode,
    currentTrack,
    loadQueue,
    playTrack,
    toggle,
    next,
    prev,
    seek,
    setVolume,
    cycleMode,
  }
})
