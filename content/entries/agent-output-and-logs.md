---
slug: agent-output-and-logs
title: 返回结果与终端日志，是两条输出通道
summary: result 模式为什么还在打印过程？一次 Agent 演示中的接口区分。
type: note
category: AI 与 Agent
topic: tech
tags: [Agent, smolagents, Python, 工具调用]
stage: evergreen
date: '2026-11-05'
featured: 0
public: true
draft: false
series: agent-notes
---

在 [两种 Agent 执行方式的演示](/articles/agent-demo-two-execution-styles/) 中，我曾遇到一个看起来很矛盾的现象：明明选择了普通 `result` 模式，终端里仍然打印完整步骤。

原因是 `run()` 的返回对象与框架的日志配置分别起作用。

## 先看函数返回了什么

当时的演示区分三种输出形式：

| 模式 | 观察重点 |
| --- | --- |
| result | 最终业务输出，例如结构化报告 |
| full-result | 带步骤、状态和耗时等信息的 RunResult |
| stream | 运行过程中逐个产生的事件 |

这回答了调用者能接收什么，尚未决定终端显示什么。

## 再看谁在打印

演示里的默认 AgentLogger 使用 INFO 级别，因此过程仍会被打印。把非 stream 演示的日志级别调整为 `LogLevel.OFF` 后，终端才只保留希望展示的结果摘要。

同样，运行级的 `run(stream=True)` 与模型级的 `stream_outputs=True` 也需要分别理解。一个关心 Agent 运行事件，另一个关心模型输出增量。

如果结果“打印得太多”或“流里没有预期事件”，我会先分清返回值、运行事件和日志，再去检查具体开关。

这篇短记对应当时的 smolagents 演示版本；接口细节以所使用版本为准。[上游源码](https://github.com/huggingface/smolagents)可用于继续核对。
