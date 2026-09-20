import { computed, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { usePlayerStore } from '../stores/player'

/**
 * 进度条拖动逻辑。
 *
 * 解决的真实问题：NSlider 在拖动过程中持续触发 update:value，
 * 若每次都直接 seek，播放中的 timeupdate 事件又会把 currentTime
 * 写回，导致滑块被"往回拽"、拖动抖动。
 *
 * 方案：pointerdown 标记拖动开始，期间 update:value 只更新本地
 * dragPercent（不回写播放器）；window 级 pointerup 时才一次性 seek。
 */
export function useProgressDrag() {
  const player = usePlayerStore()
  const { currentTime, duration } = storeToRefs(player)

  const dragging = ref(false)
  const dragPercent = ref(0)

  /** 滑块显示值：拖动中显示本地值，否则跟随播放进度 */
  const percent = computed(() =>
    dragging.value
      ? dragPercent.value
      : duration.value > 0
        ? (currentTime.value / duration.value) * 100
        : 0,
  )

  function onUpdate(v: number): void {
    if (dragging.value) {
      dragPercent.value = v
    } else {
      // 键盘操作滑块等无 pointer 事件的场景：直接 seek
      player.seek((v / 100) * duration.value)
    }
  }

  function onPointerDown(): void {
    dragging.value = true
    dragPercent.value = duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
  }

  function onWindowPointerUp(): void {
    if (!dragging.value) return
    dragging.value = false
    player.seek((dragPercent.value / 100) * duration.value)
  }

  window.addEventListener('pointerup', onWindowPointerUp)
  onUnmounted(() => window.removeEventListener('pointerup', onWindowPointerUp))

  return { percent, onUpdate, onPointerDown }
}
