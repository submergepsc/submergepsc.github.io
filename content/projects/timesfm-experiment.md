---
slug: timesfm-experiment
title: TimesFM 滚动回测
summary: 在第三方模型上做一组 ETTh1 预测实验，比较基线并保留逐窗口结果。
label: REPRODUCTION · TIMESFM
status: 复现实验
repository: https://github.com/submergepsc/timesfm
image: /assets/timesfm-windows.svg
image_alt: 滚动回测中按时间排列的八个预测窗口示意，不代表实际预测数值
facts:
  - [语言, Python]
  - [数据, ETTh1]
  - [窗口, 8 × 96h]
  - [归属, 上游 fork]
---

## 从快速跑通到多窗口观察

这份实验使用 TimesFM 进行时间序列预测。快速脚本最初只观察最后一个 96 小时窗口，后来扩展为八个非重叠窗口的滚动回测，并保留一天、一周两种季节性基线。

## 结果要有明细

实验同时输出汇总指标、逐窗口指标、逐小时预测值和一个示例图。这样可以从总分向下追到具体窗口，而不会只剩下一张表现不错的曲线。

设计和当时的结果见 [从最后一个窗口，到一组滚动回测](/articles/timesfm-rolling-backtest/)。

## 上游与个人工作

TimesFM 模型来自 [Google Research](https://github.com/google-research/timesfm)。个人仓库是其 fork；这里展示的是使用、评估脚本和实验记录，并非模型本身的开发成果。
