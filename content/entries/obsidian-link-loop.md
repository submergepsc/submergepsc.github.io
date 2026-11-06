---
slug: obsidian-link-loop
title: Obsidian 无响应：从一个软链接追到文件系统循环
summary: 一次排查里，真正有用的线索来自 vault 外一棵被意外纳入索引的代码目录。
type: article
category: Linux 与工具
tags:
- Obsidian
- Linux
- 故障排查
- 软链接
stage: growing
date: '2026-11-05'
updated: '2026-11-05'
featured: 2
public: true
draft: false
topic: tech
---

一次 Obsidian 排查中，应用可以启动，但窗口逐渐变得难以使用。关掉社区插件后问题仍在，因此排查从插件转向 vault 实际扫描的目录。

## 让文件树说话

vault 根目录里有一个指向同级 code 目录的软链接。Obsidian 沿链接继续扫描后，把整棵代码树也纳入索引。历史记录估算这棵树约有 6.1 GB、118,710 个文件；在 node_modules 下还能观察到文件系统循环提示。

> 一个看起来无害的目录链接，可能把整个大型代码树变成笔记应用的索引范围。

## 排查路径

- 确认窗口与进程仍在运行，观察 renderer 负载。
- 停用社区插件后重试，确认故障仍可复现。
- 检查 vault 根目录中的软链接，并沿链接查看目标规模。
- 观察递归扫描是否报告符号链接循环。
- 把大型代码目录移出索引范围，再重建应用索引。
- 恢复原插件和显示设置，检查日常使用是否恢复。

## 结果与边界

这次现场中，移出链接并重建 IndexedDB 后，Obsidian 恢复正常；15 个社区插件与 Sync 随后恢复。记录也说明没有发现 GPU fatal、OOM 或崩溃信号。

这是一条针对本次故障的证据链。其他 Obsidian 卡顿仍要结合自己的 vault、插件、索引与系统状态判断。日志中的目录规模是当时的观察值，不是普遍阈值。
