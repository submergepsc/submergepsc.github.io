---
slug: reproducible-paper-figures
title: 让论文图可以从输入重新生成
summary: 把 CSV、绘图脚本、输出位置与 LaTeX 引用串成一条能复跑的路径。
type: note
category: 数据实验
tags:
- Python
- 数据可视化
- 复现
stage: growing
date: '2026-11-05'
public: true
draft: false
topic: tech
featured: 0
project: rwa-plots
---

一个容易维护的绘图项目，可以先回答四个问题：输入数据在哪里、每张图由哪个脚本生成、结果保存到哪里、论文从哪个路径引用它。

RWA_PLOTS 的 README 描述了 CSV 输入、五类绘图脚本、PDF 输出和 LaTeX 引用之间的关系。把这条链写清楚，比只保留最终图片更容易检查和复现。

```text
数据：这张图读哪个 CSV，字段和单位是什么？
脚本：用哪个入口生成，需要哪些参数？
结果：输出到哪个目录，论文引用哪个文件？
```

记录下这三个位置，几周后回来修改一张图时，就有一条明确的路可以重新走一遍。数据来源和实验设置仍要随结果一起说明。

→ [RWA 绘图工作流](/projects/rwa-plots/)
