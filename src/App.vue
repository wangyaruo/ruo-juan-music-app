<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { NButton, NConfigProvider, NGlobalStyle, NIcon, NMessageProvider } from 'naive-ui'
import { MoonOutline, SunnyOutline } from '@vicons/ionicons5'
import TrackList from './components/TrackList.vue'
import ConcertView from './components/ConcertView.vue'
import PlayerBar from './components/PlayerBar.vue'
import NowPlaying from './components/NowPlaying.vue'
import QueueDrawer from './components/QueueDrawer.vue'
import ErrorWatcher from './components/ErrorWatcher.vue'
import { usePlayerStore } from './stores/player'
import { useTheme } from './composables/useTheme'
import { coverHue } from './utils/format'

const player = usePlayerStore()
const { currentTrack } = storeToRefs(player)

const { isDark, naiveTheme, themeOverrides, toggleTheme, initTheme } = useTheme()

/** 当前视图：听歌 / 演唱会 */
const view = ref<'music' | 'concert'>('music')

/** 页面顶部随当前曲目色相泛出的氛围微光 */
const ambientStyle = computed(() => {
  const t = currentTrack.value
  if (!t) return undefined
  const h = coverHue(t.id)
  return {
    background: `radial-gradient(58% 42% at 50% 0%, hsl(${h} 60% 45% / 0.18), transparent 72%)`,
  }
})

/** 切换视图；进入演唱会时暂停音乐，避免与视频声音叠加 */
function switchView(v: 'music' | 'concert'): void {
  if (v === view.value) return
  view.value = v
  if (v === 'concert') player.pause()
}

/** 桌面端键盘快捷键：空格播放/暂停，←/→ 快退快进 5 秒 */
function onGlobalKeydown(e: KeyboardEvent): void {
  const target = e.target as HTMLElement | null
  if (!target) return
  // 输入框 / 可编辑区域 / 滑块聚焦时不拦截，避免与组件自身按键行为冲突
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
    return
  if (target.closest('.n-slider')) return

  if (e.code === 'Space') {
    e.preventDefault() // 阻止页面滚动
    player.toggle()
  } else if (e.code === 'ArrowLeft') {
    player.seek(Math.max(0, player.currentTime - 5))
  } else if (e.code === 'ArrowRight') {
    player.seek(player.currentTime + 5)
  }
}

onMounted(() => {
  initTheme()
  void player.loadQueue()
  window.addEventListener('keydown', onGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<template>
  <n-config-provider :theme="naiveTheme" :theme-overrides="themeOverrides">
    <n-global-style />
    <n-message-provider>
      <error-watcher />
      <div class="ambient" :style="ambientStyle" aria-hidden="true" />
      <div class="app-shell">
        <header class="app-header">
          <h1 class="app-title">RuoJuan Music</h1>
          <nav class="view-tabs">
            <button
              class="view-tab"
              :class="{ active: view === 'music' }"
              @click="switchView('music')"
            >
              听歌
            </button>
            <button
              class="view-tab"
              :class="{ active: view === 'concert' }"
              @click="switchView('concert')"
            >
              演唱会
            </button>
          </nav>
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
          <track-list v-if="view === 'music'" />
          <concert-view v-else />
        </main>

        <player-bar />
        <now-playing />
        <queue-drawer />
      </div>
    </n-message-provider>
  </n-config-provider>
</template>
