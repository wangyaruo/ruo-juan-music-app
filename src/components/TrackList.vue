<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { NButton, NIcon, NScrollbar } from 'naive-ui'
import { Heart, HeartOutline, MusicalNotesOutline, PlayOutline } from '@vicons/ionicons5'
import { usePlayerStore } from '../stores/player'
import { coverGradient, formatTime } from '../utils/format'
import type { Track } from '../types/track'

const player = usePlayerStore()
const { queue, currentIndex, playing, loading, favorites } = storeToRefs(player)

/** 按当前时段生成问候语（QQ音乐推荐页风格） */
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '上午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

/** 列表过滤：全部 / 我喜欢 */
const filter = ref<'all' | 'fav'>('all')

/** 列表条目：保留其在原队列中的下标，用于点播与高亮 */
interface Entry {
  track: Track
  index: number
}

const displayedEntries = computed<Entry[]>(() => {
  const all = queue.value.map((track, index) => ({ track, index }))
  if (filter.value === 'fav') return all.filter((e) => favorites.value.has(e.track.id))
  return all
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

      <div class="list-tools">
        <div class="filter-chips">
          <button class="chip" :class="{ active: filter === 'all' }" @click="filter = 'all'">
            全部
          </button>
          <button class="chip" :class="{ active: filter === 'fav' }" @click="filter = 'fav'">
            我喜欢
          </button>
        </div>
      </div>

      <div v-if="displayedEntries.length === 0" class="track-empty small">
        <p class="track-empty-text">暂无收藏</p>
        <p class="track-empty-sub">点曲目右侧的红心，把喜欢的歌收进来</p>
      </div>

      <ul v-else class="track-list">
        <li
          v-for="entry in displayedEntries"
          :key="entry.track.id"
          class="track-row"
          :class="{ active: entry.index === currentIndex }"
          @click="player.playTrack(entry.index)"
        >
          <span class="track-index">
            <span
              v-if="entry.index === currentIndex && (playing || loading)"
              class="eq"
              :class="{ paused: !playing }"
              aria-hidden="true"
              ><i /><i /><i
            /></span>
            <template v-else>{{ entry.index + 1 }}</template>
          </span>

          <span class="track-cover-wrap">
            <img v-if="entry.track.cover" :src="entry.track.cover" class="track-cover" alt="" />
            <span
              v-else
              class="track-cover"
              :style="{ background: coverGradient(entry.track.id) }"
            >
              <n-icon :size="18" color="#fff"><musical-notes-outline /></n-icon>
            </span>
            <span class="cover-hover" aria-hidden="true">
              <n-icon :size="16" color="#fff"><play-outline /></n-icon>
            </span>
          </span>

          <span class="track-meta">
            <span class="track-title">{{ entry.track.title }}</span>
            <span class="track-artist">
              {{ entry.track.artist
              }}<template v-if="entry.track.album"> · {{ entry.track.album }}</template>
            </span>
          </span>

          <n-button
            text
            class="fav-btn"
            :class="{ on: favorites.has(entry.track.id) }"
            aria-label="收藏"
            @click.stop="player.toggleFavorite(entry.track.id)"
          >
            <n-icon :size="16">
              <heart v-if="favorites.has(entry.track.id)" />
              <heart-outline v-else />
            </n-icon>
          </n-button>

          <span class="track-duration">{{
            entry.track.duration ? formatTime(entry.track.duration) : ''
          }}</span>
        </li>
      </ul>
    </template>
  </n-scrollbar>
</template>
