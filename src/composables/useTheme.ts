import { computed, ref } from 'vue'
import { darkTheme } from 'naive-ui'
import type { GlobalThemeOverrides } from 'naive-ui'

// 模块级单例：全局共享一套主题状态
const isDark = ref(true)

/** Naive UI 主题：暗色用内置 darkTheme，亮色传 null 即默认主题 */
const naiveTheme = computed(() => (isDark.value ? darkTheme : null))

/** 全局主题微调：QQ音乐绿主色 */
const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#31c27c',
    primaryColorHover: '#3cd189',
    primaryColorPressed: '#29b06e',
    borderRadius: '6px',
  },
}

function applyTheme(dark: boolean): void {
  isDark.value = dark
  // 自定义区域（列表、播放条等）走 CSS 变量，与 Naive 主题同步切换
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  localStorage.setItem('rj-theme', dark ? 'dark' : 'light')
}

export function useTheme() {
  return {
    isDark,
    naiveTheme,
    themeOverrides,
    toggleTheme: () => applyTheme(!isDark.value),
    /** 应用启动时调用：恢复上次保存的主题（默认暗色） */
    initTheme: () => applyTheme(localStorage.getItem('rj-theme') !== 'light'),
  }
}
