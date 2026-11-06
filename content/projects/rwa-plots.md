---
slug: rwa-plots
title: RWA 绘图工作流
summary: 把输入 CSV、五类绘图、PDF 输出和 LaTeX 引用组织成可追溯的文件链路。
label: DATA WORKFLOW · PYTHON
status: 工程整理
repository: https://github.com/submergepsc/RWA_PLOTS
image: /assets/rwa-flow.svg
image_alt: 从 CSV 输入，经绘图脚本，到 PDF 输出与 LaTeX 引用的数据链路示意
facts:
  - [语言, Python]
  - [输入, CSV]
  - [输出, PDF]
  - [主题, 实验绘图]
---

## 让每张图都有来路

项目围绕 FastOracle/RWA 实验图的整理展开。公开 README 记录了当前有效的数据与绘图流程：根目录 CSV 作为输入，绘图脚本生成 PDF，论文再引用对应输出。

```text
CSV 输入
  → 读列、转换单位、统一方案显示名
  → plot_1 ~ plot_5
  → figures/ 下的 PDF
  → main.tex 中的图表引用
```

## 五类图各自回答什么

| 图表 | 观察方向 |
| --- | --- |
| 耗时分解 | Search、Consensus、On-chain 阶段耗时 |
| 队列动态 | 队列长度随运行过程的变化 |
| 吞吐 | 处理数量与吞吐表现 |
| 证书统计 | 证书生成相关指标的分布 |
| 可扩展性 | 数量变化与耗时之间的关系 |

## 绘图之外的工程细节

列名和显示名是两层约定：输入里使用稳定标识，图里使用统一名称。时间值也需要在汇总前处理单位。输出目录与论文引用路径要对应，才能顺利重跑和重新排版。

这些整理工作让图表有可追踪的来源。研究结论、数据归属与实验设置则需要结合原始材料解释，不能仅从一张最终图判断。

→ [让论文图可以从输入重新生成](/articles/reproducible-paper-figures/)
