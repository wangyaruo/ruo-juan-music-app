import { computed, ref } from 'vue'
import { darkTheme } from 'naive-ui'
import type { GlobalThemeOverrides } from 'naive-ui'

/** 可选主题色（主色 / 悬停 / 按压三态） */
export interface AccentOption {
  name: string
  color: string
  hover: string
  pressed: string
}

export const ACCENTS: AccentOption[] = [
  { name: 'QQ绿', color: '#31c27c', hover: '#3cd189', pressed: '#29b06e' },
  { name: '网易云红', color: '#d33a31', hover: '#e0463e', pressed: '#b72f28' },
  { name: '天空蓝', color: '#2b7de0', hover: '#4a93e8', pressed: '#1f66bd' },
  { name: '薰衣紫', color: '#8a5cf6', hover: '#a07bf8', pressed: '#7444d9' },
  { name: '落日橙', color: '#e0862b', hover: '#e89c4a', pressed: '#c26f1c' },
]

// 模块级单例：全局共享一套主题状态
const isDark = ref(true)
const accent = ref<AccentOption>(ACCENTS[0])

/** Naive UI 主题：暗色用内置 darkTheme，亮色传 null 即默认主题 */
const naiveTheme = computed(() => (isDark.value ? darkTheme : null))

/** 全局主题微调：主色跟随用户选择 */
const themeOverrides = computed<GlobalThemeOverrides>(() => ({
  common: {
    primaryColor: accent.value.color,
    primaryColorHover: accent.value.hover,
    primaryColorPressed: accent.value.pressed,
    borderRadius: '6px',
  },
}))

function applyTheme(dark: boolean): void {
  isDark.value = dark
  // 自定义区域（列表、播放条等）走 CSS 变量，与 Naive 主题同步切换
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  localStorage.setItem('rj-theme', dark ? 'dark' : 'light')
}

function applyAccent(option: AccentOption): void {
  accent.value = option
  document.documentElement.style.setProperty('--accent', option.color)
  localStorage.setItem('rj-accent', option.color)
}

export function useTheme() {
  return {
    isDark,
    accent,
    ACCENTS,
    naiveTheme,
    themeOverrides,
    toggleTheme: () => applyTheme(!isDark.value),
    setAccent: applyAccent,
    /** 应用启动时调用：恢复保存的主题与主题色（默认暗色 + QQ绿） */
    initTheme: () => {
      applyTheme(localStorage.getItem('rj-theme') !== 'light')
      const saved = localStorage.getItem('rj-accent')
      applyAccent(ACCENTS.find((a) => a.color === saved) ?? ACCENTS[0])
    },
  }
}
