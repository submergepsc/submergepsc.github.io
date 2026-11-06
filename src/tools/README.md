# 工具箱

每个工具独立为 Vue 单文件组件，用 ref、reactive、computed、v-model 和事件绑定管理输入、选项及结果。

| 工具 | 组件 |
|---|---|
| JSON 格式化 | JsonTool.vue |
| GitHub 图片直链 | GitHubImageTool.vue |
| Base64 编解码 | Base64Tool.vue |
| URL 编解码 | UrlTool.vue |
| 时间戳转换 | TimestampTool.vue |
| 文本统计 | TextStatsTool.vue |
| 文本行整理 | LineCleanerTool.vue |

catalog.json 负责名称、分类、描述、关键词和路径。transforms.js 是与界面无关的纯函数，便于测试；../composables/useToolState.js 统一管理结果、错误、示例和复制，../components/ToolEditor.vue 复用双栏编辑表单。

新增工具：

1. 在 catalog.json 登记唯一 slug 及展示信息。
2. 创建工具 Vue 组件；将可独立测试的转换逻辑放入 transforms.js 或新的函数模块。
3. 在 ../pages/ToolPage.vue 的组件映射中登记。
4. 执行 npm test 和 npm run build，检查桌面、手机与深浅主题。

路由、工具目录、主站搜索和站点地图会根据登记信息自动更新。输入仅在浏览器处理；结果通过 Vue 插值或表单值展示，不将用户输入作为网页 HTML 执行。
