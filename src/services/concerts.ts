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
  {
    bvid: 'BV1DXdHBQErs',
    title: '太阳之子 + 惊叹号（Day2 开场 · 全网首发）',
    group: '嘉年华II · 南宁站 Day2 2026-04-18',
    date: '2026-04-18',
  },
  {
    bvid: 'BV1Jw5z6LEsA',
    title: '太阳之子（温州首场）',
    group: '嘉年华II · 温州站 2026-05-15',
    date: '2026-05-15',
  },
  {
    bvid: 'BV1Au5f6GEax',
    title: '告白气球',
    group: '嘉年华II · 温州站 2026-05-16',
    date: '2026-05-16',
  },
  {
    bvid: 'BV1Jq5Z6PEhs',
    title: '说好不哭',
    group: '嘉年华II · 温州站 2026-05-16',
    date: '2026-05-16',
  },
  {
    bvid: 'BV1BZLM68EX2',
    title: '连名带姓（曹阳）',
    group: '嘉年华II · 温州站 2026-05-16',
    date: '2026-05-16',
  },
  {
    bvid: 'BV1CPL66dE3A',
    title: '彩虹',
    group: '嘉年华II · 温州站 2026-05-16',
    date: '2026-05-16',
  },
  {
    bvid: 'BV1JhLz6JEqk',
    title: '一路向北',
    group: '嘉年华II · 温州站 2026-05-16',
    date: '2026-05-16',
  },
  {
    bvid: 'BV1waLu6TE4y',
    title: '分裂（歌迷点歌 · 23场老粉小姑娘）',
    group: '嘉年华II · 温州站 2026-05-16',
    date: '2026-05-16',
  },
  {
    bvid: 'BV11bTq6YEja',
    title: '鸟巢官方官摄集锦（龙拳·北京嘉年华）',
    group: '嘉年华II · 北京站（鸟巢）2026-06-27',
    date: '2026-06-27',
  },
  {
    bvid: 'BV158TP69EjA',
    title: '谁稀罕',
    group: '嘉年华II · 北京站（鸟巢）2026-06-27',
    date: '2026-06-27',
  },
  {
    bvid: 'BV1yqTT61EGx',
    title: '稻香（摇滚版）+ 等你下课',
    group: '嘉年华II · 北京站（鸟巢）2026-06-27',
    date: '2026-06-27',
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
