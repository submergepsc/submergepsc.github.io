---
slug: timesfm-rolling-backtest
title: 从单次预测到滚动回测
summary: 用多个时间窗口和简单基线观察预测方法，保留逐窗口结果以便复查。
type: article
category: 数据实验
topic: tech
tags: [TimesFM, 时间序列, Python, 复现]
stage: growing
date: '2026-11-05'
updated: '2026-11-07'
featured: 0
project: timesfm-experiment
public: true
draft: false
---

一次预测只能展示模型在一个时间段上的表现。滚动回测把评估拆成多个窗口，可以观察误差随时间怎样变化，避免只根据一张示例曲线判断方法。

## 用多个窗口观察表现

我的 TimesFM 实验以 ETTh1 为数据集，将单个 96 小时预测窗口扩展为 8 个非重叠窗口。每个窗口分别计算指标，最后再汇总。

```text
历史上下文 → 预测窗口 → 计算指标
       在多个时间段重复
                 ↓
         逐窗口明细与汇总
```

比较不同方法时，需要保持数据划分、输入上下文和预处理一致，并记录使用的模型版本。

## 加入容易解释的基线

实验使用一天和一周两种季节性基线：以此前相隔 24 小时或 168 小时的观测值作为预测。这样的简单方法可以帮助判断复杂模型的改进是否稳定。

除了比较平均误差，也应检查哪些窗口的差异更大，以及结果是否主要受少数时间段影响。

## 保留可以复查的输出

| 输出 | 用途 |
|---|---|
| 汇总指标 | 比较各方法的整体表现 |
| 逐窗口指标 | 观察不同时间段的误差变化 |
| 逐小时预测值 | 重算指标或检查具体预测 |
| 示例图 | 查看某个窗口的曲线和预测区间 |

保留这些输出后，可以从汇总结果继续追到具体时间点，而不会只剩下一张图。

代码入口见[我的 TimesFM 实验仓库](https://github.com/submergepsc/timesfm)。模型来自 [Google Research TimesFM](https://github.com/google-research/timesfm)；我的工作是使用、评估脚本与复现实验。
