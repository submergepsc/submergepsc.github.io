---
slug: clipboard-has-more-than-text
title: 剪贴板不只有文本：一次 CopyQ 排查笔记
summary: 文本、选区、文件 URI 与 PNG 图片，可能走不同的数据路径。
type: note
category: Linux 与工具
tags:
- CopyQ
- Linux
- Wayland
- 剪贴板
stage: evergreen
date: '2026-11-05'
public: true
draft: false
topic: tech
featured: 0
---

排查剪贴板管理器漏记内容时，先把“复制了什么”拆开：普通文本、PRIMARY selection、文件 URI，以及 PNG 图片并不一定走同一条通道。

- 文本：常见的 application clipboard 内容。
- 选区：Linux 桌面中常见的 PRIMARY selection。
- 复制的文件：可能以 text/uri-list 暴露。
- 截图：例如 image/png 图片格式。

历史环境中，这四类分别做过验证；当时的修复涉及 XWayland 启动方式与开启 selection 监控。不同桌面和版本的行为可能变化，复用配置前先针对自己的会话逐项验证。
