<script setup lang="ts">
import { computed, ref } from 'vue'
import { NIcon, NScrollbar } from 'naive-ui'
import { OpenOutline, PlayOutline } from '@vicons/ionicons5'
import { concerts, bilibiliEmbedUrl, bilibiliPageUrl } from '../services/concerts'
import type { ConcertVideo } from '../services/concerts'

const selected = ref<ConcertVideo>(concerts[0])
const page = ref(1)

const embedUrl = computed(() => bilibiliEmbedUrl(selected.value.bvid, page.value))
const pageUrl = computed(() => bilibiliPageUrl(selected.value.bvid))
const pageCount = computed(() => selected.value.pages ?? 1)

/** 按场次分组（保持 concerts 中的先后顺序） */
const groups = computed(() => {
  const map = new Map<string, ConcertVideo[]>()
  for (const c of concerts) {
    const list = map.get(c.group)
    if (list) {
      list.push(c)
    } else {
      map.set(c.group, [c])
    }
  }
  return [...map.entries()].map(([name, items]) => ({ name, items }))
})

function select(video: ConcertVideo): void {
  if (video.bvid === selected.value.bvid) return
  selected.value = video
  page.value = 1
}
</script>

<template>
  <div class="concert-view">
    <div class="concert-stage">
      <div class="video-frame">
        <iframe
          :key="embedUrl"
          :src="embedUrl"
          scrolling="no"
          frameborder="0"
          allowfullscreen
          title="B站视频播放器"
        ></iframe>
      </div>

      <div class="video-bar">
        <div class="video-info">
          <div class="video-title">{{ selected.title }}</div>
          <div class="video-sub">{{ selected.group }}</div>
        </div>
        <a class="bili-link" :href="pageUrl" target="_blank" rel="noopener noreferrer">
          在 B 站打开
          <n-icon :size="13"><open-outline /></n-icon>
        </a>
      </div>

      <div v-if="pageCount > 1" class="page-row">
        <button
          v-for="p in pageCount"
          :key="p"
          class="page-btn"
          :class="{ active: p === page }"
          @click="page = p"
        >
          P{{ p }}
        </button>
      </div>
    </div>

    <n-scrollbar class="concert-side">
      <div v-for="g in groups" :key="g.name" class="concert-group">
        <div class="group-name">{{ g.name }}</div>
        <ul class="concert-list">
          <li
            v-for="c in g.items"
            :key="c.bvid"
            class="concert-row"
            :class="{ active: c.bvid === selected.bvid }"
            @click="select(c)"
          >
            <span class="concert-thumb">
              <n-icon :size="15" color="#fff"><play-outline /></n-icon>
            </span>
            <span class="concert-title">{{ c.title }}</span>
          </li>
        </ul>
      </div>
    </n-scrollbar>
  </div>
</template>
