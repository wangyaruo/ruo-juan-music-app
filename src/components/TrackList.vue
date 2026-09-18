<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { NIcon, NScrollbar } from 'naive-ui'
import { MusicalNotesOutline } from '@vicons/ionicons5'
import { usePlayerStore } from '../stores/player'
import { coverHue, formatTime } from '../utils/format'

const player = usePlayerStore()
const { queue, currentIndex, playing, loading } = storeToRefs(player)

/** 无封面时根据曲目 id 生成稳定的占位渐变色 */
function coverStyle(id: string): string {
  const h = coverHue(id)
  return `linear-gradient(135deg, hsl(${h} 55% 48%), hsl(${(h + 45) % 360} 55% 34%))`
}
</script>

<template>
  <n-scrollbar class="track-scroll">
    <ul class="track-list">
      <li
        v-for="(track, i) in queue"
        :key="track.id"
        class="track-row"
        :class="{ active: i === currentIndex }"
        @click="player.playTrack(i)"
      >
        <span class="track-index">
          <span
            v-if="i === currentIndex && (playing || loading)"
            class="eq"
            :class="{ paused: !playing }"
            aria-hidden="true"
          ><i /><i /><i /></span>
          <template v-else>{{ i + 1 }}</template>
        </span>

        <img v-if="track.cover" :src="track.cover" class="track-cover" alt="" />
        <span v-else class="track-cover" :style="{ background: coverStyle(track.id) }">
          <n-icon :size="18" color="#fff"><musical-notes-outline /></n-icon>
        </span>

        <span class="track-meta">
          <span class="track-title">{{ track.title }}</span>
          <span class="track-artist">{{ track.artist }}</span>
        </span>

        <span class="track-duration">{{ track.duration ? formatTime(track.duration) : '' }}</span>
      </li>
    </ul>
  </n-scrollbar>
</template>
