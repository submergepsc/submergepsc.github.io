---
slug: agent-demo-two-execution-styles
title: 同一个小任务，两种 Agent 执行方式
summary: 固定任务、控制模型输出，再观察 CodeAgent 与 ToolCallingAgent 怎样走完步骤。
type: article
category: AI 与 Agent
tags:
- Agent
- smolagents
- 实验
- 工具调用
stage: seedling
date: '2026-11-05'
public: true
draft: false
topic: tech
featured: 0
series: agent-notes
---

为了比较两种 Agent 的执行过程，我先固定了一个小任务：把 `[3, 7, 11, 15]` 求和、将结果翻倍，再构造结构化报告。求和应得到 36，翻倍得到 72。任务结果明确，过程也足够短，适合观察每一步发生了什么。

## CodeAgent：动作写在生成的代码里

演示把过程拆成三个 ActionStep，并在步骤间复用 `values`、`original_total` 与 `report` 等状态。观察重点是模型生成的代码如何访问执行环境，以及状态怎样延续到下一步。

## ToolCallingAgent：动作交给工具接口

另一组演示依次调用 `sum_numbers`、`multiply`、`build_report` 和 `final_answer`。工具名与参数显式出现在动作中，便于检查每一步是否符合预期。

```text
CodeAgent
  生成代码 → 执行 → 在后续步骤复用状态 → 返回报告

ToolCallingAgent
  sum_numbers → multiply → build_report → final_answer
```

## 固定模型输出，观察框架行为

这组演示使用 scripted model，让模型动作序列可控。测试关注的是返回类型、最终值、RunResult 字段和事件类型，而不是哪一种模型“更聪明”。

两类 Agent 各自覆盖 `result`、`full-result` 和 `stream` 三种模式，组成 2 × 3 的矩阵。在那次记录中，CodeAgent 为三个动作步骤、13 个流事件，ToolCallingAgent 为四个动作步骤、21 个流事件。这些数量来自特定演示设置。

## 对照实验能说明什么

演示也暴露过脚本自身的问题：一个模型步骤的代码字符串意外混入 `return response`，导致解释器失败，后续步骤依赖的 `report` 没有被创建。固定动作和测试把问题缩小到具体步骤，而不是停留在“Agent 运行失败”。

这份对照帮助观察框架接口、状态传递和日志行为。真实模型的规划与工具选择，还需要另外设计任务与评估。

> 比较 Agent 时先固定输入和目标，再单独观察执行轨迹；不要把一段 scripted demo 当成模型能力评测。

→ [返回结果与终端日志，是两条输出通道](/articles/agent-output-and-logs/)
