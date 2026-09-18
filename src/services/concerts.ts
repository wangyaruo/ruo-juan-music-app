/**
 * B 站演唱会视频条目。
 * 播放方式：B 站官方嵌入播放器（player.bilibili.com iframe），
 * 播放仍走 B 站服务器与播放器，与在 B 站观看等同。
 *
 * 新增条目：打开视频页，复制地址中 BV 号填入即可；多分 P 视频设置 pages。
 */
export interface ConcertVideo {
  /** 视频 BV 号（bilibili.com/video/<BV号>） */
  bvid: string
  title: string
  /** 分组名（场次），列表按此分组展示 */
  group: string
  date: string
  /** 分 P 数量，单 P 视频省略 */
  pages?: number
}

export const concerts: ConcertVideo[] = [
  {
    bvid: 'BV1oMSRBuEHJ',
    title: '4K 高音质 · 全程录影（2小时46分）',
    group: '嘉年华II · 杭州站 2026-04-05',
    date: '2026-04-05',
  },
  {
    bvid: 'BV1QAKw66ENS',
    title: '断了的弦 + 太阳之子（燃爆开场）',
    group: '嘉年华II · 南宁站 2026-04-17',
    date: '2026-04-17',
  },
  {
    bvid: 'BV15kKP6QEzS',
    title: '惊叹号',
    group: '嘉年华II · 南宁站 2026-04-17',
    date: '2026-04-17',
  },
  {
    bvid: 'BV1xBKA6iER9',
    title: '甜甜的',
    group: '嘉年华II · 南宁站 2026-04-17',
    date: '2026-04-17',
  },
  {
    bvid: 'BV1mnK66kEyE',
    title: '简单爱',
    group: '嘉年华II · 南宁站 2026-04-17',
    date: '2026-04-17',
  },
  {
    bvid: 'BV1CmKz6NEYV',
    title: '黑色毛衣',
    group: '嘉年华II · 南宁站 2026-04-17',
    date: '2026-04-17',
  },
  {
    bvid: 'BV12t3u6NERf',
    title: '漂移',
    group: '嘉年华II · 南宁站 2026-04-17',
    date: '2026-04-17',
  },
]

/** B 站官方嵌入播放器地址 */
export function bilibiliEmbedUrl(bvid: string, page = 1): string {
  const params = new URLSearchParams({
    bvid,
    page: String(page),
    autoplay: '0',
    danmaku: '0',
    high_quality: '1',
  })
  return `https://player.bilibili.com/player.html?${params.toString()}`
}

/** B 站原视频页地址（嵌入被上传者关闭时的回退入口） */
export function bilibiliPageUrl(bvid: string): string {
  return `https://www.bilibili.com/video/${bvid}`
}
