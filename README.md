# factor-mining-showcase

量化因子挖掘系统的**演示视频页**（纯静态，无后端）。

- 线上：<https://factor-mining-showcase.pages.dev>
- 页面只有一个视频播放器，首页即录像。

## ⚠️ 重要：不要使用 `_headers` 文件

本仓库**刻意不含** `_headers`。原因是它会让视频进度条拖不动。

**实测 A/B 对照**（同一站点、仅差 `_headers`，用浏览器媒体栈作判据）：

| 部署 | `_headers` | 第 1 秒 `video.seekable` | 跳到 98s |
|---|---|---|---|
| 含 `_headers` | ✅ 有 | `[0, 0]`（持续 8s 以上） | ❌ 失败，弹回 1.7s |
| 已移除 | ❌ 无 | `[0, 147.9]` | ✅ 成功 |

**原因**：`_headers` 会让 Cloudflare Pages 的响应失去 HTTP Range 支持。
浏览器拿不到 `206 Partial Content`，就判定整段视频不可跳转，
`v.seekable` 退化为 `[0, 0]`，进度条因此完全拖不动。

**判据提示**：不要用原始 HTTP 请求测 Range（很容易误判 —— 实测连 cdnjs 这种必然支持
分段的站点，用脚本发 Range 也会返回 200）。**用 `video.seekable` 才是权威**：
正常应为 `[0, duration]`，若为 `[0, 0]` 就说明分段不可用。

**替代方案**：noindex 改用 `robots.txt`（`Disallow: /`）+ HTML 里的
`<meta name="robots" content="noindex">`。这两者已足够，且不影响媒体分段。

## 内容

```
index.html        视频播放页（含海报层，点击后才加载视频）
media/av1.mp4     AV1 · 2560×1238 · 11.87 MiB
media/h264.mp4    H.264 · 1920×928 · 18.55 MiB（兼容性回退）
media/poster.jpg  封面（1600 宽，119 KB）
robots.txt        Disallow: /
```

> ⚠️ **本仓库刻意不含 `_headers`** —— 它会破坏 Cloudflare Pages 的 Range 支持，
> 导致视频进度条拖不动。详见下方「重要」一节。

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
