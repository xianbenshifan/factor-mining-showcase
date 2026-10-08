# factor-mining-showcase

量化因子挖掘系统的**演示录像页**（纯静态，无后端）。

- 线上：<https://factor-mining-showcase.pages.dev>
- 页面只有一个视频播放器，首页即录像。

## 内容

```
index.html        视频播放页（含海报层，点击后才加载视频）
media/av1.mp4     AV1 · 2560×1238 · 11.87 MiB
media/h264.mp4    H.264 · 1920×928 · 18.55 MiB（兼容性回退）
media/poster.jpg  封面（1600 宽，119 KB）
robots.txt        Disallow: /
_headers          X-Robots-Tag: noindex
```

页面用 `<source>` 依次声明 AV1 与 H.264，浏览器自动挑选支持的格式：
现代浏览器播放 AV1（体积更小、保留原分辨率），不支持 AV1 的环境回落到 H.264。

## 视频是怎么处理的

源录像为 `20261008_111900.mp4`：2560×1238 @ 20fps，H.264，**58.88 MiB**。

处理过程：

1. **音轨是数字静音**（实测 RMS −94 dB、峰值 −57.7 dB），因此**直接替换**为 BGM，而非混音。
2. BGM 做 **1.5s 淡入 / 2s 淡出**，响度归一到 **−16 LUFS**（输出实测 −16.0 LUFS，真峰值 −3.8 dBFS）。
3. 视频以两个档次重编码，各自都在 Cloudflare Pages 的**单文件 25 MiB**上限内。

体积从 58.88 MiB 降到 11.87 / 18.55 MiB，靠的是录屏内容以大块静态 UI 为主、极易压缩。

## 部署

```bash
npx wrangler pages deploy . --project-name factor-mining-showcase --branch main
```

## 注意

- 页面为 `noindex`（`robots.txt` + `_headers` 双保险），不参与搜索引擎收录。
- 录像内容需自行确认无敏感信息：本页只做技术处理，未做内容审查。
- 单文件不得超过 **25 MiB**，替换视频时请先确认体积。
