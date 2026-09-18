import type { Track } from '../types/track'

/**
 * 音乐来源适配器接口。
 *
 * 设计意图：UI 与播放逻辑只依赖本接口，不关心数据来自哪里。
 * 后期接入在线爬取源时，新增一个实现本接口的类并在 createMusicSource()
 * 中替换即可，组件与 store 零改动。
 */
export interface MusicSource {
  /** 来源标识，如 'demo' / 'netease' */
  readonly name: string
  /** 获取默认歌单（首页展示用） */
  getTracks(): Promise<Track[]>
  /** 关键词搜索；不支持搜索的来源可不实现 */
  search?(keyword: string): Promise<Track[]>
}

/**
 * 【临时】演示数据源。
 * 使用免版权测试音频，仅用于打通播放链路；
 * 接入真实在线源后应整体删除本类。
 */
class DemoSource implements MusicSource {
  readonly name = 'demo'

  async getTracks(): Promise<Track[]> {
    const base = 'https://www.soundhelix.com/examples/mp3'
    return [
      { id: 'demo-1', title: 'SoundHelix Song 1', artist: 'T. Schürger', album: 'Demo', url: `${base}/SoundHelix-Song-1.mp3` },
      { id: 'demo-2', title: 'SoundHelix Song 2', artist: 'T. Schürger', album: 'Demo', url: `${base}/SoundHelix-Song-2.mp3` },
      { id: 'demo-3', title: 'SoundHelix Song 3', artist: 'T. Schürger', album: 'Demo', url: `${base}/SoundHelix-Song-3.mp3` },
      { id: 'demo-4', title: 'SoundHelix Song 4', artist: 'T. Schürger', album: 'Demo', url: `${base}/SoundHelix-Song-4.mp3` },
      { id: 'demo-5', title: 'SoundHelix Song 5', artist: 'T. Schürger', album: 'Demo', url: `${base}/SoundHelix-Song-5.mp3` },
    ]
  }
}

/** 当前生效的音乐来源（后期在此切换为在线爬取源） */
export function createMusicSource(): MusicSource {
  return new DemoSource()
}
