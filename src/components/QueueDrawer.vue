<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { NButton, NDrawer, NDrawerContent, NIcon } from 'naive-ui'
import { CloseOutline, MusicalNotesOutline } from '@vicons/ionicons5'
import { usePlayerStore } from '../stores/player'
import { coverGradient } from '../utils/format'

const player = usePlayerStore()
const { queue, currentIndex, queueOpen } = storeToRefs(player)

/** 拖拽排序：记录被拖起条目的下标 */
const dragFrom = ref<number | null>(null)

function onDrop(to: number): void {
  if (dragFrom.value !== null) {
    player.moveInQueue(dragFrom.value, to)
  }
  dragFrom.value = null
}
</script>

<template>
  <n-drawer v-model:show="queueOpen" :width="340" placement="right">
    <n-drawer-content body-content-style="padding: 0 8px 16px">
      <template #header>
        <div class="q-header">
          <span>播放队列（{{ queue.length }}）</span>
          <n-button text size="small" :disabled="queue.length === 0" @click="player.clearQueue()">
            清空
          </n-button>
        </div>
      </template>

      <div v-if="queue.length === 0" class="q-empty">队列为空</div>

      <ul v-else class="q-list">
        <li
          v-for="(t, i) in queue"
          :key="t.id"
          class="q-row"
          :class="{ active: i === currentIndex, dragging: dragFrom === i }"
          draggable="true"
          @dragstart="dragFrom = i"
          @dragend="dragFrom = null"
          @dragover.prevent
          @drop="onDrop(i)"
          @click="player.playTrack(i)"
        >
          <span class="q-num">{{ i + 1 }}</span>

          <img v-if="t.cover" :src="t.cover" class="q-cover" alt="" />
          <span v-else class="q-cover" :style="{ background: coverGradient(t.id) }">
            <n-icon :size="14" color="#fff"><musical-notes-outline /></n-icon>
          </span>

          <span class="q-meta">
            <span class="q-title">{{ t.title }}</span>
            <span class="q-artist">{{ t.artist }}</span>
          </span>

          <n-button text class="q-del" aria-label="从队列移除" @click.stop="player.removeFromQueue(i)">
            <n-icon :size="15"><close-outline /></n-icon>
          </n-button>
        </li>
      </ul>
    </n-drawer-content>
  </n-drawer>
</template>
