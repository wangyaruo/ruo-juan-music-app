/** 一首可播放曲目的最小信息单元 */
export interface Track {
  /** 来源内唯一 id */
  id: string
  title: string
  artist: string
  album?: string
  /** 音频流地址（在线 URL 或本地 blob URL） */
  url: string
  /** 封面图地址；缺省时 UI 使用占位渐变色块 */
  cover?: string
  /** 时长（秒）；未知时由音频元数据加载后回填 */
  duration?: number
  /** LRC 格式歌词文本；无歌词的曲目（如纯音乐）省略 */
  lrc?: string
  /** 是否为用户本地导入的文件（持久化在 IndexedDB，移除时联动删除） */
  local?: boolean
}
