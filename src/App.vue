<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
import { usePlayerStore } from './stores/player'

const player = usePlayerStore()
const isDark = ref(true)

// Naive UI 主题：暗色用内置 darkTheme，亮色传 null 即默认主题
const naiveTheme = computed(() => (isDark.value ? darkTheme : null))

// 全局主题微调：主色用音乐感的红，圆角收敛
const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#d33a31',
    primaryColorHover: '#e0463e',
    primaryColorPressed: '#b72f28',
    borderRadius: '6px',
  },
}

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
    </div>
  </n-config-provider>
</template>
