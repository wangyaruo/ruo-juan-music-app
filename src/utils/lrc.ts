/** 一行歌词：时间（秒）+ 文本 */
export interface LyricLine {
  time: number
  text: string
}

/**
 * 解析 LRC 格式歌词。
 * 支持：一行多个时间标签（[00:12.34][00:34.56]同一句）、
 * 两位或三位毫秒（.12 与 .123 皆可）、忽略 [ti:][ar:] 等元数据行、
 * 跳过无时间标签行与空文本行。返回按时间升序的数组。
 */
export function parseLrc(lrc: string): LyricLine[] {
  const lines: LyricLine[] = []
  const tagPattern = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g

  for (const raw of lrc.split(/\r?\n/)) {
    const tags = [...raw.matchAll(tagPattern)]
    if (tags.length === 0) continue

    const text = raw.replace(/\[[^\]]*\]/g, '').trim()
    if (!text) continue

    for (const t of tags) {
      const minutes = Number(t[1])
      const seconds = Number(t[2])
      const fraction = t[3] ? Number(t[3].padEnd(3, '0')) / 1000 : 0
      lines.push({ time: minutes * 60 + seconds + fraction, text })
    }
  }

  return lines.sort((a, b) => a.time - b.time)
}
