<script setup lang="ts">
import { h, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { NButton, useMessage } from 'naive-ui'
import { usePlayerStore } from '../stores/player'

/** 监听播放器错误状态并弹出全局提示（需置于 NMessageProvider 内），附重试按钮 */
const player = usePlayerStore()
const { error } = storeToRefs(player)
const message = useMessage()

watch(error, (e) => {
  if (!e) return
  message.error(
    () =>
      h('div', { class: 'err-toast' }, [
        h('span', null, e),
        h(
          NButton,
          {
            text: true,
            size: 'small',
            type: 'primary',
            onClick: () => player.retry(),
          },
          { default: () => '重试' },
        ),
      ]),
    { duration: 6000 },
  )
})
</script>

<template>
  <span v-if="false"></span>
</template>
