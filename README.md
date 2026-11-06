# SubmergePSC 的数字花园

记录技术实践、阅读与日常。内容从个人工程记录和公开项目整理，使用 Markdown 写作，生成静态 HTML。

站点目标地址：<https://submergepsc.github.io/>。首次发布前需要完成 GitHub Pages 配置。

## 本地使用

需要 Python 3.12。依赖固定在 requirements.txt，运行时无需 Node 或数据库。

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python build.py
.venv/bin/python -m http.server 4173 --bind 127.0.0.1 --directory dist
```

打开 <http://127.0.0.1:4173/>。改完内容或页面后重新执行 `build.py` 并刷新。

## 写文章与随记

在 `content/entries/` 新增 Markdown。先写草稿，检查后再设置 `public: true` 与 `draft: false`。两个条件必须同时满足，页面、搜索、RSS、专题和关联链接才会收录。

```yaml
---
slug: a-small-observation
title: 一个具体的观察
summary: 用一句话介绍这则记录。
date: '2026-11-05'
type: note
category: 阅读札记
topic: thinking
tags: [阅读, 记录]
stage: seedling
public: false
draft: true
---

正文从这里开始。
```

字段取值：

- `type`：`article` 长文、`note` 短记、`essay` 花园手记、`journal` 日常随记。
- `topic`：`tech` 技术实践、`thinking` 阅读与思考、`life` 日常生活。
- `stage`：`seedling` 幼苗、`growing` 生长中、`evergreen` 常青。
- `updated`：可选，内容修改日期，格式同 `date`。
- `featured`：可选的首页推荐顺序，`1` 到 `3`；默认不推荐。
- `project`：可选，关联 `content/projects/` 的文件名。
- `series`：可选，关联 `content/site.json` 里的专题 ID。

日期加引号。正文支持常规 Markdown、表格、代码块和脚注。笔记之间使用普通 Markdown 链接；构建时会从公开文章计算反向链接。

`journal` 会自动出现在随记页。项目资料放在 `content/projects/`，品牌与专题放在 `content/site.json`，公开仓库目录放在 `content/repositories.json`。

## 多工具网站

独立的 [tools/ 目录](tools/README.md) 管理 `/tools/` 工具箱与各工具页面，包含 JSON、GitHub 图片直链、Base64、URL、时间戳、文本统计和文本行整理。GitHub 图片工具支持批量转换为 raw 或 jsDelivr 链接，并输出 Markdown / HTML 引用。工具仅在浏览器中处理输入。新增工具按该目录的说明扩展。

## 构建与发布

`build.py` 只读取仓库内的精选内容，输出在 `dist/`。原始 worklog、规划与私人笔记应保留在仓库外。搜索索引包含公开全文，任何写进公开 Markdown 的内容都会随站点发布。

GitHub Actions 工作流在 PR 中检查构建，在 `main` 更新后构建并发布 `dist/`；首次启用时需将仓库 Settings → Pages → Source 设为 **GitHub Actions**。本地只保留源码，生成产物不提交。

继续开发可以从 `build.py`、`assets/site.css` 和 `assets/site.js` 开始。常规发布只需改 Markdown 与项目资料。
