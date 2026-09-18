<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import {
  NButton,
  NConfigProvider,
  NGlobalStyle,
  NIcon,
  darkTheme,
} from 'naive-ui'
import type { GlobalThemeOverrides } from 'naive-ui'
import { MoonOutline, SunnyOutline } from '@vicons/ionicons5'
import TrackList from './components/TrackList.vue'
import PlayerBar from './components/PlayerBar.vue'
import NowPlaying from './components/NowPlaying.vue'
import { usePlayerStore } from './stores/player'
import { coverHue } from './utils/format'

const player = usePlayerStore()
const { currentTrack } = storeToRefs(player)
const isDark = ref(true)

// Naive UI 主题：暗色用内置 darkTheme，亮色传 null 即默认主题
const naiveTheme = computed(() => (isDark.value ? darkTheme : null))

// 全局主题微调：QQ音乐绿主色
const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#31c27c',
    primaryColorHover: '#3cd189',
    primaryColorPressed: '#29b06e',
    borderRadius: '6px',
  },
}

/** 页面顶部随当前曲目色相泛出的氛围微光 */
const ambientStyle = computed(() => {
  const t = currentTrack.value
  if (!t) return undefined
  const h = coverHue(t.id)
  return {
    background: `radial-gradient(58% 42% at 50% 0%, hsl(${h} 60% 45% / 0.18), transparent 72%)`,
  }
})

function applyTheme(dark: boolean): void {
  isDark.value = dark
  // 自定义区域（列表、播放条等）走 CSS 变量，与 Naive 主题同步切换
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  localStorage.setItem('rj-theme', dark ? 'dark' : 'light')
}

function toggleTheme(): void {
  applyTheme(!isDark.value)
}

onMounted(() => {
  applyTheme(localStorage.getItem('rj-theme') !== 'light')
  void player.loadQueue()
})
</script>

<template>
  <n-config-provider :theme="naiveTheme" :theme-overrides="themeOverrides">
    <n-global-style />
    <div class="ambient" :style="ambientStyle" aria-hidden="true" />
    <div class="app-shell">
      <header class="app-header">
        <h1 class="app-title">RuoJuan Music</h1>
        <n-button quaternary circle aria-label="切换明暗主题" @click="toggleTheme">
          <template #icon>
            <n-icon :size="20">
              <sunny-outline v-if="isDark" />
              <moon-outline v-else />
            </n-icon>
          </template>
        </n-button>
      </header>

      <main class="app-main">
        <track-list />
      </main>

      <player-bar />
      <now-playing />
    </div>
  </n-config-provider>
</template>
