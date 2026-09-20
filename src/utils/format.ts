import type { PlayMode } from '../stores/player'

/** 秒 → "mm:ss" */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '00:00'
  const total = Math.floor(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** 由曲目 id 生成稳定色相值（0-360），用于无封面时的占位渐变色块 */
export function coverHue(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 360
  }
  return hash
}

/** 播放模式的中文标签 */
export function playModeLabel(mode: PlayMode): string {
  const labels: Record<PlayMode, string> = {
    sequence: '顺序播放',
    'loop-one': '单曲循环',
    shuffle: '随机播放',
  }
  return labels[mode]
}

/** 由色相值生成封面占位渐变（列表封面、播放条封面、黑胶封面共用） */
export function coverGradientByHue(hue: number): string {
  return `linear-gradient(135deg, hsl(${hue} 55% 48%), hsl(${(hue + 45) % 360} 55% 34%))`
}

/** 由曲目 id 生成稳定的封面占位渐变 */
export function coverGradient(id: string): string {
  return coverGradientByHue(coverHue(id))
}
