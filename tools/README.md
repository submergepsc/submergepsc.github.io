# 多工具网站目录

这个目录负责博客的 `/tools/` 工具箱分区，页面共用主站的导航、明暗主题与页脚。工具输入在浏览器内处理，不发送、不写入 URL，也不保存到本地存储。

目前包含：JSON 格式化与压缩、GitHub 图片直链转换、Base64 编解码、URL 编解码、时间戳转换、文本统计、文本行整理。

## GitHub 图片直链

入口：`/tools/github-image/`。粘贴公开仓库图片的文件链接，每行一个，可生成 GitHub 原图（raw）或 jsDelivr 地址，输出为纯链接、Markdown 或 HTML。

```text
https://github.com/submergepsc/moonbit/blob/main/image.png
→ https://raw.githubusercontent.com/submergepsc/moonbit/main/image.png
```

支持已有 raw 地址和带版本的 jsDelivr GitHub 地址；保留分支、提交与文件路径，统一编码中文、空格和特殊字符，并去除查询参数与片段。分支或标签名含 `/` 时，可填写完整名称以明确边界。CDN 链接是否可用由该服务及源仓库决定。

此功能只改写 URL，不检查图片存在性，也不将私有仓库变为公开图床。HTML 的图片说明做属性转义；所有结果先显示为文本，不自动加载图片。

## 文件结构

```text
tools/
  catalog.json    工具名称、分类、描述、关键词与路由
  pages.py        工具目录与各个工具页面
  toolbox.js     目录筛选、工具处理和复制交互
  toolbox.css    工具区专用布局与样式
```

从网站根目录运行 `python3 build.py` 后，页面生成到 `dist/tools/`，专用样式和脚本在 `dist/tools/assets/`。目录与各工具页面会自动加入站点地图；主站搜索收录工具名称与说明。

## 增加新工具

1. 在 `catalog.json` 添加唯一的 `slug`、标题、描述、分类、展示标记和关键词。
2. 在 `pages.py` 的 `utility()` 中添加对应表单，使用明确的 label 和结果区域。
3. 在 `toolbox.js` 中按 `data-tool` 添加处理逻辑，结果通过文本节点或表单值显示。
4. 需要新布局时修改 `toolbox.css`，同时检查手机与深色主题。
5. 重新构建，检查正常输入、无效输入、复制、清空和站内链接。

工具的原始输入不会进入站点生成器、搜索索引或 RSS。需要服务器或外部 API 的工具应单独设计数据流，并向使用者说明。
