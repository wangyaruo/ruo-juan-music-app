<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { NButton, NIcon, NSlider } from 'naive-ui'
import {
  ChevronDownOutline,
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
import { coverHue, formatTime, playModeLabel } from '../utils/format'

const player = usePlayerStore()
const { currentTrack, playing, currentTime, duration, volume, playMode, npOpen } =
  storeToRefs(player)

/** 当前曲目封面色相，驱动氛围背景渐变 */
const hue = computed(() => (currentTrack.value ? coverHue(currentTrack.value.id) : 210))

const npStyle = computed(() => ({ '--hue': String(hue.value) }))

const discCoverStyle = computed(() => ({
  background: `linear-gradient(135deg, hsl(${hue.value} 55% 48%), hsl(${(hue.value + 45) % 360} 55% 34%))`,
}))

const progress = computed<number>({
  get: () => (duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0),
  set: (v) => player.seek((v / 100) * duration.value),
})

const modeLabel = computed(() => playModeLabel(playMode.value))

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') player.closeNowPlaying()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <transition name="np">
    <div v-if="npOpen" class="np-overlay" :style="npStyle">
      <div class="np-bg" aria-hidden="true" />

      <n-button class="np-close" text aria-label="收起播放页" @click="player.closeNowPlaying()">
        <n-icon :size="28" color="#fff"><chevron-down-outline /></n-icon>
      </n-button>

      <div class="np-body">
        <div class="disc" :class="{ spinning: playing }">
          <div class="disc-cover">
            <img v-if="currentTrack?.cover" :src="currentTrack.cover" alt="" />
            <span v-else class="disc-placeholder" :style="discCoverStyle">
              <n-icon :size="56" color="rgba(255,255,255,.9)"><musical-notes-outline /></n-icon>
            </span>
          </div>
        </div>

        <div class="np-info">
          <div class="np-big-title">{{ currentTrack?.title ?? '未在播放' }}</div>
          <div class="np-big-artist">{{ currentTrack?.artist ?? '从列表选一首歌开始' }}</div>
        </div>

        <div class="np-progress">
          <span class="np-time">{{ formatTime(currentTime) }}</span>
          <n-slider
            v-model:value="progress"
            :step="0.1"
            :tooltip="false"
            :disabled="!currentTrack"
            class="np-progress-slider"
          />
          <span class="np-time">{{ duration > 0 ? formatTime(duration) : '--:--' }}</span>
        </div>

        <div class="np-controls">
          <n-button text :title="modeLabel" @click="player.cycleMode()">
            <n-icon :size="20" color="#fff">
              <shuffle-outline v-if="playMode === 'shuffle'" />
              <span v-else class="repeat-wrap">
                <repeat-outline />
                <sup v-if="playMode === 'loop-one'" class="repeat-one">1</sup>
              </span>
            </n-icon>
          </n-button>

          <n-button text aria-label="上一首" @click="player.prev()">
            <n-icon :size="32" color="#fff"><play-back-outline /></n-icon>
          </n-button>

          <n-button
            circle
            type="primary"
            class="np-play"
            aria-label="播放或暂停"
            @click="player.toggle()"
          >
            <n-icon :size="32" color="#fff">
              <pause-outline v-if="playing" />
              <play-outline v-else />
            </n-icon>
          </n-button>

          <n-button text aria-label="下一首" @click="player.next()">
            <n-icon :size="32" color="#fff"><play-forward-outline /></n-icon>
          </n-button>

          <div class="np-volume">
            <n-icon :size="18" color="rgba(255,255,255,.8)"><volume-high-outline /></n-icon>
            <n-slider
              :value="Math.round(volume * 100)"
              :step="1"
              :tooltip="false"
              class="np-volume-slider"
              @update:value="(v: number) => player.setVolume(v / 100)"
            />
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>
