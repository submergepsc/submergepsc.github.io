# 开发与维护

基于 **Vue 3 + Vite + Vue Router** 的个人网站，用于项目展示、技术笔记与在线工具。文章用 Markdown 写作，由 Node.js 处理，通过 Vite SSG 生成每个页面的静态 HTML。构建和运行均不需要 Python。

页面与源码结构见 [网站完整结构说明](SITE_STRUCTURE.md)，工具扩展见 [工具目录说明](../src/tools/README.md)。

## 本地使用

需要 Node.js 22.12 或更新版本，推荐 Node.js 22。仓库的 .nvmrc 已指定 22。

```bash
npm ci
npm run dev
```

在浏览器中打开终端打印的 Local 地址。修改 Vue 组件或样式会热更新；修改文章、项目或站点配置会重新准备内容并刷新页面。

## 构建、检查与预览

```bash
npm test
npm run build
npm run preview
```

运行预览命令后，在浏览器打开终端打印的地址。生成结果在 dist/，构建会校验页面、站内链接、资源引用、锚点与 XML。通过 HTTP 服务预览，直接使用 file:// 打开会使根路径资源和模块脚本无法正常工作。

## 写技术笔记

在 content/entries/ 新增 Markdown，例如：

```yaml
---
slug: a-small-observation
title: 一个具体的观察
summary: 用一句话介绍这则记录。
date: '2026-11-07'
type: note
category: 阅读札记
topic: thinking
tags: [阅读, 记录]
stage: seedling
public: false
draft: true
---
```

frontmatter 后写 Markdown 正文。发布时同时设置 public: true 与 draft: false；其余内容会在渲染和打包前排除，不进入网页、浏览器数据、搜索、RSS 或站点地图。

- type：article 长文、note 短记、essay 花园手记、journal 随记。
- topic：tech 技术实践、thinking 阅读与思考、life 日常生活。
- stage：seedling 幼苗、growing 生长中、evergreen 常青。
- updated：可选更新日期，与 date 格式相同。
- featured：可选的首页推荐顺序，最多推荐 3 篇。
- project：可选的关联项目文件名，例如 moon-markdown。
- series：可选的专题标识，在 content/site.json 中登记。

项目介绍放在 content/projects/；公开仓库目录在 content/repositories.json。项目 Markdown 全部参与发布，尚没有独立草稿开关。未公开的写作素材保留在仓库外。

## 修改界面和工具

- src/components/：导航、页脚、文章卡片、Markdown 正文等公共组件。
- src/pages/：首页、花园、文章、项目、搜索和其他页面。
- src/tools/：7 个工具组件、登记信息和纯 JavaScript 转换函数。
- src/styles/：全站、工具箱和 Vue 组件补充样式。
- public/assets/：图标、项目截图和示意图。

工具输入只在浏览器中处理，不上传、不写 URL 或本地存储。主题偏好单独保存在本地存储中。

## 域名

默认主地址是 https://submergepsc.github.io，在 content/site.json 的 url 中配置。部署时也可以设置构建环境变量 SITE_URL=https://你的域名 来覆盖它，canonical、RSS 和 sitemap 会一同更新。构建脚本读取系统环境变量；仅复制 .env.example 不会自动加载变量。

## GitHub Pages

.github/workflows/pages.yml 在 PR 中构建检查，main 推送后安装 Node.js 22，执行 npm ci 和 npm run build，上传并发布 dist/。仓库 Settings → Pages → Source 使用 GitHub Actions。

## Cloudflare Workers

仓库的 wrangler.jsonc 已显式指定静态资产目录 dist/，构建命令 npm run build，Worker 名为 submergepsc-github-io。Workers Builds 连接此仓库，生产分支选 main，根目录使用仓库根目录：

| 设置 | 内容 |
|---|---|
| Build command | 留空，由 Wrangler 的自定义构建步骤执行 npm run build |
| Deploy command | npx wrangler deploy |
| Node.js | 仓库 .nvmrc 指定 22 |
| 自定义域名 | 部署成功后，在 Worker 的 Settings → Domains & Routes 添加 |

Cloudflare 会按 package-lock.json 安装 Node 依赖。旧 Python 和 Jekyll 构建文件已移除，不再使用 _site。使用自定义域名时，在部署平台绑定域名并同步设置 SITE_URL。

如果另外使用 Cloudflare Pages，构建命令为 npm run build，输出目录为 dist，框架选择 None。
