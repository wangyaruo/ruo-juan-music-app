<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { NIcon, NScrollbar } from 'naive-ui'
import { MusicalNotesOutline, PlayOutline } from '@vicons/ionicons5'
import { usePlayerStore } from '../stores/player'
import { coverGradient, formatTime } from '../utils/format'

const player = usePlayerStore()
const { queue, currentIndex, playing, loading } = storeToRefs(player)

/** 按当前时段生成问候语（QQ音乐推荐页风格） */
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '上午好'
  if (h < 18) return '下午好'
  return '晚上好'
})
</script>

<template>
  <n-scrollbar class="track-scroll">
    <div v-if="queue.length === 0" class="track-empty">
      <n-icon :size="44" class="track-empty-icon"><musical-notes-outline /></n-icon>
      <p class="track-empty-text">歌单为空</p>
      <p class="track-empty-sub">还没有可播放的曲目</p>
    </div>

    <template v-else>
      <div class="hero">
        <div class="hero-hi">{{ greeting }}</div>
        <div class="hero-sub">今天想听什么？共 {{ queue.length }} 首，点击任意一首开始播放</div>
      </div>

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
              ><i /><i /><i
            /></span>
            <template v-else>{{ i + 1 }}</template>
          </span>

          <span class="track-cover-wrap">
            <img v-if="track.cover" :src="track.cover" class="track-cover" alt="" />
            <span v-else class="track-cover" :style="{ background: coverGradient(track.id) }">
              <n-icon :size="18" color="#fff"><musical-notes-outline /></n-icon>
            </span>
            <span class="cover-hover" aria-hidden="true">
              <n-icon :size="16" color="#fff"><play-outline /></n-icon>
            </span>
          </span>

          <span class="track-meta">
            <span class="track-title">{{ track.title }}</span>
            <span class="track-artist">
              {{ track.artist }}<template v-if="track.album"> · {{ track.album }}</template>
            </span>
          </span>

          <span class="track-duration">{{ track.duration ? formatTime(track.duration) : '' }}</span>
        </li>
      </ul>
    </template>
  </n-scrollbar>
</template>
