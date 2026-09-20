<script setup lang="ts">
import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessage } from 'naive-ui'
import { usePlayerStore } from '../stores/player'

/** 监听播放器错误状态并弹出全局提示（需置于 NMessageProvider 内） */
const { error } = storeToRefs(usePlayerStore())
const message = useMessage()

watch(error, (e) => {
  if (e) message.error(e, { duration: 4000 })
})
</script>

<template>
  <span v-if="false"></span>
</template>
