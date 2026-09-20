# RuoJuan Music

极简音乐播放器：只听歌 + 简约 UI，外加一个 B 站演唱会观看面板。刻意不做 QQ音乐/网易云式的繁杂玩法。

## 功能

- **听歌**：歌单列表、播放/暂停、上一首/下一首（超 3 秒先回开头）、进度拖动（拖动中不回跳）、音量调节与静音、顺序/单曲/随机三种播放模式、缓冲进度显示
- **歌词**：播放页 LRC 歌词滚动高亮（点击行跳播、手动滚动 3 秒后恢复跟随），纯音乐显示占位
- **全屏播放页**：点击播放条封面展开——氛围渐变背景、旋转黑胶唱片（切歌封面过渡动画）、大进度条；Esc、下滑箭头或下滑手势关闭
- **歌单管理**：收藏（红心 + "我喜欢"过滤）、最近播放、歌名/歌手搜索、播放队列抽屉（点击播放、单删、清空、拖拽排序）
- **演唱会面板**：B 站官方嵌入播放器观看演唱会视频（周杰伦嘉年华II 杭州/南宁/温州/北京鸟巢等场次），按场次分组，记住上次观看
- **听歌工具**：睡眠定时（10-60 分钟到点暂停）、键盘快捷键（空格播放/暂停、←/→ 快退快进、↑/↓ 音量、M 静音）
- **个性化**：明暗双主题 + 5 种主题色自定义（均持久化）、Media Session 锁屏媒体控制、PWA 主屏安装
- **响应式**：桌面与手机浏览器均可用

## 技术栈

Vue 3 + Vite + TypeScript + Pinia + Naive UI（+ @vicons/ionicons5），ESLint（flat config）+ Prettier。

## 快速开始

```bash
npm install
npm run dev        # 开发服务器
npm run typecheck  # 类型检查（vue-tsc）
npm run lint       # ESLint
npm run format     # Prettier 统一格式
npm run build      # 生产构建（先过类型检查）
```

## 目录结构

```
src/
├── components/       # TrackList / PlayerBar / NowPlaying / ConcertView / QueueDrawer / ErrorWatcher
├── composables/      # useTheme（明暗主题+主题色）、useProgressDrag（进度条拖动）
├── services/
│   ├── source.ts     # MusicSource 音源适配器接口（当前为临时演示源）
│   └── concerts.ts   # 演唱会视频条目（B 站 BV 号维护处）
├── stores/player.ts  # 播放器核心：单例 Audio 引擎 + 队列/进度/模式/收藏/最近播放/睡眠定时 + Media Session
├── types/track.ts    # Track 数据结构（含 lrc 歌词字段）
└── utils/            # format.ts（时间/封面渐变/模式标签）、lrc.ts（LRC 解析）
```

## 接入真实音源

`src/services/source.ts` 定义了 `MusicSource` 接口（`getTracks()` / 可选 `search()`）。新增一个实现类并替换 `createMusicSource()` 的返回即可，UI 与播放逻辑零改动。当前的 `DemoSource` 是免版权测试音频，仅用于打通链路，接真实源后删除。

## 维护演唱会视频

编辑 `src/services/concerts.ts` 的 `concerts` 数组：复制 B 站视频页地址中的 BV 号填入，`group` 字段相同的条目会自动归为一组；多分 P 视频设置 `pages`。播放走 B 站官方嵌入播放器（`player.bilibili.com`），与在 B 站观看等同。

## 合规说明

- 演示音源为免版权测试音频（SoundHelix）。
- 演唱会视频通过 B 站官方嵌入播放器播放，播放行为发生在 B 站服务器与播放器内；本项目不抓取、不转存任何音视频流。
