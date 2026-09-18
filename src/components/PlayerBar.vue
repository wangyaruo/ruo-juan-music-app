<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { NButton, NIcon, NSlider, NSpin } from 'naive-ui'
import {
  MusicalNotesOutline,
  PauseOutline,
  PlayBackOutline,
  PlayForwardOutline,
  PlayOutline,
  RepeatOutline,
  ShuffleOutline,
  VolumeHighOutline,
} from '@vicons/ionicons5'
import { usePlayerStore } from '../stores/player'
import { coverHue, formatTime } from '../utils/format'

const player = usePlayerStore()
const { currentTrack, playing, loading, currentTime, duration, volume, playMode } =
  storeToRefs(player)

/** 进度条百分比（双向绑定：拖动即 seek） */
const progress = computed<number>({
  get: () => (duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0),
  set: (v) => player.seek((v / 100) * duration.value),
})

const modeLabel = computed(
  () =>
    ({
      sequence: '顺序播放',
      'loop-one': '单曲循环',
      shuffle: '随机播放',
    })[playMode.value],
)

const npCoverStyle = computed(() => {
  if (!currentTrack.value) return undefined
  const h = coverHue(currentTrack.value.id)
  return {
    background: `linear-gradient(135deg, hsl(${h} 55% 48%), hsl(${(h + 45) % 360} 55% 34%))`,
  }
})
</script>

<template>
  <footer class="player-bar">
    <n-slider
      v-model:value="progress"
      :step="0.1"
      :tooltip="false"
      :disabled="!currentTrack"
      class="progress-slider"
    />

    <div class="player-row">
      <div class="now-playing">
        <img v-if="currentTrack?.cover" :src="currentTrack.cover" class="np-cover" alt="" />
        <span v-else class="np-cover" :style="npCoverStyle">
          <n-icon :size="20" color="#fff"><musical-notes-outline /></n-icon>
        </span>
        <div class="np-meta">
          <span class="np-title">{{ currentTrack?.title ?? '未在播放' }}</span>
          <span class="np-artist">{{ currentTrack?.artist ?? '从列表选一首歌开始' }}</span>
        </div>
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
        <span class="time">{{ formatTime(currentTime) }} / {{ duration > 0 ? formatTime(duration) : '--:--' }}</span>
        <div class="volume">
          <n-icon :size="16"><volume-high-outline /></n-icon>
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
