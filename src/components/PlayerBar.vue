<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { NButton, NDropdown, NIcon, NSlider, NSpin } from 'naive-ui'
import {
  Heart,
  HeartOutline,
  ListOutline,
  MusicalNotesOutline,
  PauseOutline,
  PlayBackOutline,
  PlayForwardOutline,
  PlayOutline,
  RepeatOutline,
  ShuffleOutline,
  TimeOutline,
  VolumeHighOutline,
  VolumeMuteOutline,
} from '@vicons/ionicons5'
import { usePlayerStore } from '../stores/player'
import { useProgressDrag } from '../composables/useProgressDrag'
import { coverGradient, formatTime, playModeLabel } from '../utils/format'

const player = usePlayerStore()
const {
  currentTrack,
  playing,
  loading,
  currentTime,
  duration,
  volume,
  playMode,
  favorites,
  buffered,
  muted,
  sleepAt,
} = storeToRefs(player)

/** 进度条（拖动中不回跳，松手才 seek） */
const {
  percent: progress,
  onUpdate: onProgressUpdate,
  onPointerDown: onProgressDown,
} = useProgressDrag()

const modeLabel = computed(() => playModeLabel(playMode.value))

const npCoverStyle = computed(() =>
  currentTrack.value ? { background: coverGradient(currentTrack.value.id) } : undefined,
)

// ---------- 睡眠定时 ----------
const sleepOptions = [
  { label: '不开启', key: 'off' },
  { label: '10 分钟', key: 10 },
  { label: '20 分钟', key: 20 },
  { label: '30 分钟', key: 30 },
  { label: '60 分钟', key: 60 },
]

function onSleepSelect(key: string | number): void {
  player.setSleepTimer(key === 'off' ? null : Number(key))
}

/** 每秒刷新一次剩余时间显示 */
const now = ref(Date.now())
let tick: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  tick = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (tick) clearInterval(tick)
})

const sleepLeftText = computed(() => {
  if (!sleepAt.value) return ''
  const left = Math.max(0, Math.round((sleepAt.value - now.value) / 1000))
  const m = Math.floor(left / 60)
  const s = left % 60
  return `${m}:${String(s).padStart(2, '0')}`
})
</script>

<template>
  <footer class="player-bar">
    <div class="progress-wrap" @pointerdown="onProgressDown">
      <div class="buffer-bar" :style="{ width: buffered + '%' }" aria-hidden="true" />
      <n-slider
        :value="progress"
        :step="0.1"
        :tooltip="false"
        :disabled="!currentTrack"
        class="progress-slider"
        @update:value="onProgressUpdate"
      />
    </div>

    <div class="player-row">
      <div class="now-playing">
        <span
          class="np-cover-btn"
          role="button"
          title="展开播放页"
          @click="player.openNowPlaying()"
        >
          <img v-if="currentTrack?.cover" :src="currentTrack.cover" class="np-cover" alt="" />
          <span v-else class="np-cover" :style="npCoverStyle">
            <n-icon :size="20" color="#fff"><musical-notes-outline /></n-icon>
          </span>
        </span>
        <div class="np-meta">
          <span class="np-title">{{ currentTrack?.title ?? '未在播放' }}</span>
          <span class="np-artist">{{ currentTrack?.artist ?? '从列表选一首歌开始' }}</span>
        </div>
        <n-button
          text
          class="np-fav"
          :class="{ on: currentTrack && favorites.has(currentTrack.id) }"
          :disabled="!currentTrack"
          aria-label="收藏"
          @click="currentTrack && player.toggleFavorite(currentTrack.id)"
        >
          <n-icon :size="18">
            <heart v-if="currentTrack && favorites.has(currentTrack.id)" />
            <heart-outline v-else />
          </n-icon>
        </n-button>
      </div>

      <div class="controls">
        <n-button text class="mode-btn" :title="modeLabel" @click="player.cycleMode()">
          <n-icon :size="18">
            <shuffle-outline v-if="playMode === 'shuffle'" />
            <span v-else class="repeat-wrap">
              <repeat-outline />
              <sup v-if="playMode === 'loop-one'" class="repeat-one">1</sup>
            </span>
          </n-icon>
        </n-button>

        <n-button text aria-label="上一首" @click="player.prev()">
          <n-icon :size="24"><play-back-outline /></n-icon>
        </n-button>

        <n-button
          circle
          size="large"
          type="primary"
          class="play-btn"
          aria-label="播放或暂停"
          @click="player.toggle()"
        >
          <n-spin v-if="loading" :size="18" stroke="#fff" />
          <n-icon v-else :size="26" color="#fff">
            <pause-outline v-if="playing" />
            <play-outline v-else />
          </n-icon>
        </n-button>

        <n-button text aria-label="下一首" @click="player.next()">
          <n-icon :size="24"><play-forward-outline /></n-icon>
        </n-button>
      </div>

      <div class="right-side">
        <span class="time"
          >{{ formatTime(currentTime) }} / {{ duration > 0 ? formatTime(duration) : '--:--' }}</span
        >
        <n-dropdown trigger="click" :options="sleepOptions" @select="onSleepSelect">
          <n-button text aria-label="睡眠定时" title="睡眠定时" class="sleep-btn">
            <n-icon :size="18"><time-outline /></n-icon>
            <span v-if="sleepLeftText" class="sleep-left">{{ sleepLeftText }}</span>
          </n-button>
        </n-dropdown>

        <n-button text aria-label="播放队列" title="播放队列" @click="player.openQueue()">
          <n-icon :size="19"><list-outline /></n-icon>
        </n-button>

        <div class="volume">
          <n-button text class="vol-btn" aria-label="静音" @click="player.toggleMute()">
            <n-icon :size="16">
              <volume-mute-outline v-if="muted" />
              <volume-high-outline v-else />
            </n-icon>
          </n-button>
          <n-slider
            :value="Math.round(volume * 100)"
            :step="1"
            :tooltip="false"
            class="volume-slider"
            @update:value="(v: number) => player.setVolume(v / 100)"
          />
        </div>
      </div>
    </div>
  </footer>
</template>
