# SubmergePSC 数字花园：Vue 3 完整结构

更新时间：2026-11-07。本文描述 Vue 3 重构后的当前源码；重构前的 Python 版本已备份到仓库外 deliverables/pre-vue3-*.tar.gz。

## 1. 网站组成

这是一个记录技术、阅读与日常的多页面个人网站，包含 35 个静态 HTML 页面、11 篇公开记录、3 个项目详情、7 个工具、2 个专题。公开仓库目录包含26个仓库，搜索索引包含11篇记录和7个工具。

```text
首页
├── 花园 → 文章详情 → 关联项目、专题、相关笔记及反向链接
├── 项目 → 项目详情 / 公开仓库目录
├── 工具箱 → 7 个独立工具
├── 随记
├── 关于
├── 搜索
├── 专题 → 专题详情
├── 归档
├── 近况
└── 404
```

## 2. 页面显示结构

所有页面共用 SiteHeader、主内容区和 SiteFooter。导航包括首页、花园、项目、工具箱、随记、关于，右侧是搜索、主题按钮和手机菜单；页脚补充专题、归档、近况和 RSS。

| 页面 | 显示内容与交互 |
|---|---|
| 首页 | 主标题与植物图形、三个主题入口、最多3篇精选、4篇最近更新、2个项目卡片、近况入口 |
| 花园 | 所有公开记录；按类型、分类、标签、主题、生长状态组合筛选，条件和浏览器历史同步 |
| 文章 | 标题摘要、日期标签、目录、Markdown正文、代码复制、项目/专题入口、反向链接和最多3篇相关笔记 |
| 项目 | 项目卡片；详情包含技术信息、截图、目录、正文和关联文章 |
| 仓库目录 | 按分类展示静态整理的公开GitHub仓库信息，不在访问时调用GitHub API |
| 工具箱 | 关键词搜索与分类筛选；每个工具有独立Vue组件与路由 |
| 随记 | 仅展示 type 为 journal 的公开记录，目前没有真实条目，因此显示空状态 |
| 关于 | 作者介绍、花园说明、阅读方式和相关入口 |
| 搜索 | 加载 search-index.json，在浏览器中做全文及多关键词匹配，并同步 q 查询参数 |
| 专题 | 按文章 series 聚合，无公开文章的专题不生成详情 |
| 归档 | 按文章 date 的月份分组 |
| 近况 | InfoPage.vue 中手动维护的当前关注内容 |
| 404 | 不存在地址的说明及返回首页入口；Cloudflare使用404-page回退 |

## 3. 全部页面路径

路径保持与重构前一致。查询参数是页面状态，不另外生成HTML。

| 路径 | 页面 |
|---|---|
| `/` | 首页 |
| `/garden/` | 花园 |
| `/projects/` | 项目 |
| `/projects/repositories/` | 公开仓库目录 |
| `/tools/` | 工具箱 |
| `/journal/` | 随记 |
| `/about/` | 关于 |
| `/search/` | 搜索 |
| `/series/` | 专题 |
| `/archive/` | 归档 |
| `/now/` | 近况 |
| `/404.html` | 404 |
| `/articles/workflow-context/` | 用一份工作日志，接住下次继续时的自己 |
| `/articles/vim-task-first/` | 学 Vim 时，先想要完成什么任务 |
| `/articles/timesfm-rolling-backtest/` | 从最后一个窗口，到一组滚动回测 |
| `/articles/reproducible-paper-figures/` | 让论文图可以从输入重新生成 |
| `/articles/obsidian-link-loop/` | Obsidian 无响应：从一个软链接追到文件系统循环 |
| `/articles/moonbit-markdown-renderer/` | 一个 Markdown 渲染核心，接上 CLI 和浏览器 |
| `/articles/coverage-is-not-correctness/` | 覆盖率 98%，为什么还有 7 个失败用例 |
| `/articles/clipboard-has-more-than-text/` | 剪贴板不只有文本：一次 CopyQ 排查笔记 |
| `/articles/agent-output-and-logs/` | 返回结果与终端日志，是两条输出通道 |
| `/articles/agent-demo-two-execution-styles/` | 同一个小任务，两种 Agent 执行方式 |
| `/articles/a-garden-begins/` | 关于这座数字花园 |
| `/projects/moon-markdown/` | Moon Markdown |
| `/projects/rwa-plots/` | RWA 绘图工作流 |
| `/projects/timesfm-experiment/` | TimesFM 滚动回测 |
| `/series/agent-notes/` | Agent 的执行与输出 |
| `/series/moon-markdown/` | Moon Markdown 实现笔记 |
| `/tools/json/` | JSON 格式化 |
| `/tools/github-image/` | GitHub 图片直链 |
| `/tools/base64/` | Base64 编解码 |
| `/tools/url/` | URL 编解码 |
| `/tools/timestamp/` | 时间戳转换 |
| `/tools/text-stats/` | 文本统计 |
| `/tools/line-cleaner/` | 文本行整理 |

另有 RSS、sitemap、robots 与搜索索引等文件，它们不计入35个HTML页面。

## 4. 项目源码目录

仓库根目录是 /home/loviya/Documents/submergepsc-blog/site/。下列文件均由同一个项目管理。

```text
site/
├── index.html                 Vite入口，加载src/main.js
├── package.json               npm命令与固定版本依赖
├── package-lock.json          依赖锁，npm ci按此安装
├── .nvmrc                     Node.js 22
├── .env.example               SITE_URL构建环境变量示例
├── vite.config.js             Vue插件、SSG、内容修改刷新和预览端口
├── wrangler.jsonc             Cloudflare Workers静态资产配置
├── .github/workflows/pages.yml GitHub Pages自动构建和发布
├── content/
│   ├── site.json              品牌、作者、简介、主地址和专题
│   ├── repositories.json      仓库介绍与分类
│   ├── entries/*.md           文章与随记
│   └── projects/*.md          项目说明
├── public/assets/             图标、项目截图、SVG示意图
├── scripts/
│   ├── prepare-content.mjs    过滤公开内容、Markdown渲染、索引/RSS/sitemap
│   └── validate-output.mjs    校验生成页面、文件、站内链接和锚点
├── src/
│   ├── main.js                ViteSSG/Vue Router应用入口与滚动行为
│   ├── App.vue                公共布局及RouterView
│   ├── router.js              所有固定及内容页面的路由
│   ├── data.js                公开内容数据导出及显示名称
│   ├── generated/content.json 自动生成并被Git忽略，只含公开内容
│   ├── components/            可复用界面组件
│   ├── pages/                 页面组件
│   ├── composables/           主题以外的可复用状态/行为
│   ├── tools/                 工具组件、登记和纯函数
│   └── styles/                全站、工具箱与补充样式
├── tests/                     内容发布边界和工具逻辑的Node测试
├── docs/SITE_STRUCTURE.md      本说明
└── dist/                      npm run build生成，Git忽略
```

## 5. Vue组件与页面分工

| 文件 | 职责 |
|---|---|
| SiteHeader.vue | 导航、主题切换、手机菜单；切换页面或按Escape时关闭菜单 |
| SiteFooter.vue | 辅助导航、订阅与GitHub链接 |
| PageIntro.vue | 通用页面标题、介绍和扩展内容插槽 |
| EntryMeta.vue | 文章日期、状态、阅读时间、标签 |
| EntryCard.vue | 文章卡片，可用于花园、首页、专题和随记 |
| ProjectCard.vue | 项目配图、简介和入口 |
| ArticleToc.vue | 标题目录与锚点链接 |
| MarkdownBody.vue | 显示构建时生成的正文，处理代码复制和站内正文链接 |
| ToolEditor.vue | 输入/输出双栏、选项和操作插槽；v-model绑定数据 |

components均位于src/components/。页面位于src/pages/：HomePage、GardenPage、ArticlePage、ProjectsPage、ProjectPage、RepositoriesPage、ToolsPage、ToolPage、SearchPage、CollectionsPage、InfoPage、NotFoundPage。

CollectionsPage根据props区分专题索引、专题详情和归档；InfoPage区分关于、近况与随记。router.js为各个实际内容地址登记路由，并传入slug或kind。App中的RouterView按路径切换组件，查询参数变化由页面自己的响应式逻辑处理。

composables包括：usePageHead管理title、canonical、OpenGraph和文章JSON-LD；useClipboard管理复制结果；useToolState统一工具输入、输出、错误、清空、示例和复制。没有引入全局状态库，小范围状态通过ref/reactive/computed组织。

## 6. 七个工具的结构

| 组件 | 功能 |
|---|---|
| JsonTool.vue | JSON校验、格式化、压缩，保留大整数、重复键及指数写法 |
| GitHubImageTool.vue | GitHub图片文件页、raw与jsDelivr互转；支持批量、含/的分支、自定义说明及Markdown/HTML输出 |
| Base64Tool.vue | UTF-8与Base64互转，支持标准及URL安全形式，验证编码有效位 |
| UrlTool.vue | 单个URL参数值的编码和解码 |
| TimestampTool.vue | 秒/毫秒与UTC/本地日期互转，支持负值并拒绝无效日期 |
| TextStatsTool.vue | Unicode码点、字素、非空白字符、行、UTF-8字节及词段统计 |
| LineCleanerTool.vue | 按行稳定去重、空白/空行选项、忽略大小写和自然排序 |

catalog.json登记名称、分类、关键词、描述与slug。ToolPage根据slug选择组件，ToolsPage用computed筛选登记数据。transforms.js中的纯函数不访问DOM，便于独立测试。

用户输入绑定到Vue状态，点击操作后计算结果并更新输出框。输入不上传、不写URL或本地存储；深浅主题偏好由导航组件独立存储。GitHub图片工具不加载或验证远端图片，只改写地址。

## 7. 文章、项目和专题数据

文章保留Markdown+YAML frontmatter：

```yaml
---
slug: my-first-note
title: 我的第一篇笔记
summary: 一句话说明。
date: '2026-11-07'
type: note
category: 阅读札记
topic: thinking
tags: [阅读]
stage: seedling
public: true
draft: false
---
```

- type为article/note/essay/journal；topic为tech/thinking/life；stage为seedling/growing/evergreen。
- updated可指定更新日期，featured用于首页精选顺序。
- project关联项目文件名；series关联site.json登记的专题。
- 只有public严格为true且draft严格为false才会在构建前进入渲染；草稿原文不会被Vite直接导入浏览器。
- 项目路由以Markdown文件名为标识，项目目录目前全部公开，没有文章草稿开关。
- Markdown渲染得到正文HTML、文字、标题锚点和链接；用于目录、搜索、相关文章和反向链接。
- 项目配图保存在public/assets/，项目元数据填写/assets/文件名。

站点主地址在content/site.json的url中配置。系统构建环境变量SITE_URL可以覆盖它，同时影响canonical、结构化数据、RSS及站点地图。

## 8. 完整显示和交互流程

```text
npm run build
  → Node过滤草稿、渲染Markdown、整理公开JSON数据
  → Vue组件读取公开数据并组成页面
  → Vite打包CSS/JavaScript
  → Vite SSG为35个路由渲染完整HTML
  → 校验链接、资源、标题锚点及机器读取文件
  → dist/发布到托管平台

用户访问
  → 服务器直接返回该地址已生成的HTML，正文无需等待JS
  → 浏览器加载CSS与Vue应用
  → Vue接管已显示的页面，绑定交互
  → 导航、筛选、搜索、主题和工具由Vue更新
```

Python已从构建链路移除。Node.js也只在开发和构建时运行，线上不需要常驻Node服务。

开发时执行npm run dev，Vite在http://127.0.0.1:5173/运行并热更新。修改content/文章或配置会自动重新处理并刷新页面。生产构建为npm run build，npm run preview在http://127.0.0.1:4174/预览dist。

## 9. 构建产物与部署

```text
dist/
├── index.html
├── garden/index.html
├── articles/<slug>/index.html
├── projects/index.html及各详情
├── tools/index.html及7个工具页面
├── journal/about/search/now/archive/series/等页面
├── assets/                    打包后的JS、CSS与静态图片
├── search-index.json
├── rss.xml
├── sitemap.xml
├── robots.txt
├── .nojekyll
└── 404.html
```

GitHub Actions使用Node22、npm ci和npm run build，发布dist。Cloudflare Workers使用wrangler.jsonc：构建npm run build，assets.directory为./dist，html_handling为auto-trailing-slash，未匹配地址显示404页面。旧_config.yml已移除，不再触发Jekyll自动识别。

Cloudflare Pages也可使用同一仓库：构建npm run build，发布dist。自定义域名须在实际托管平台绑定，SITE_URL须同步为该主地址。仓库中准备好配置不代表外部平台已经部署成功。

## 10. 常见修改入口

| 修改目标 | 位置 |
|---|---|
| 新文章、随记 | content/entries/ |
| 项目正文与配图 | content/projects/、public/assets/ |
| 品牌、作者、主地址与专题 | content/site.json |
| 首页内容布局 | src/pages/HomePage.vue |
| 关于、近况与随记文案 | src/pages/InfoPage.vue |
| 导航与页脚 | src/components/SiteHeader.vue、SiteFooter.vue |
| 全站样式、响应式 | src/styles/site.css |
| 工具专用样式 | src/styles/toolbox.css |
| 新工具 | src/tools/catalog.json、工具组件、ToolPage.vue组件映射 |
| Markdown渲染或发布过滤 | scripts/prepare-content.mjs |
| GitHub发布 | .github/workflows/pages.yml |
| Cloudflare发布 | wrangler.jsonc及Cloudflare项目设置 |

本说明不会自动生成网站页面；它作为仓库内的维护文档保留。
