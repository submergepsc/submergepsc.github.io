---
slug: moon-markdown
title: Moon Markdown
summary: 用 MoonBit 实现一个小型 Markdown 渲染器，让同一核心连接库、CLI 与浏览器。
label: OPEN SOURCE · MOONBIT
status: 功能迭代
repository: https://github.com/submergepsc/moonbit
image: /assets/moon-markdown.png
image_alt: Moon Markdown 的编辑、预览和 HTML 输出界面，含操作入口标注
facts:
  - [语言, MoonBit]
  - [入口, 库 / CLI / Web]
  - [输出, HTML]
  - [主题, 文本工具]
---

## 一个核心，三种使用方式

Moon Markdown 把 Markdown 文本转为 HTML。项目提供 `render(markdown)` 库接口，也让 CLI 与浏览器页面复用同一个渲染核心。

- **库调用**：把字符串传给 `render`，获取 HTML。
- **CLI**：从 Markdown 文件转换到标准输出，或写入 HTML 文件。
- **Web 页面**：编辑与实时预览、打开本地文件、复制或下载转换结果。

## 范围明确，行为可预期

README 列出了标题、段落、强调、链接、图片、引用、列表、代码块、表格和转义等支持项，也保留暂未支持的语法说明。

实现过程中，图片属性转义、残缺语法回退以及输入输出 fixture，都是需要单独检查的边界。

```bash
moon check
moon test
moon build --target js
```

## 可以继续读什么

[一个 Markdown 渲染核心，接上 CLI 和浏览器](/articles/moonbit-markdown-renderer/) 介绍项目的入口、示例和实现取舍。

截图取自项目仓库的使用说明图。代码和支持范围以[公开仓库](https://github.com/submergepsc/moonbit)的对应版本为准。
