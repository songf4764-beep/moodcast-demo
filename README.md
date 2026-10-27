# MOODCAST 播客推荐 Demo

基于 React 19、TypeScript、Vite 8、Tailwind CSS 4 的移动端交互原型。

## 功能

- 首页需求输入、情绪与时长选择、推荐结果及条件调整。
- 试听播放器、进度跳转、节目收藏。
- AI 精听摘要与章节、逐字稿、多轮问答和聊天记录滚动。
- 发现页分类与搜索、章节摘要。
- 我的收听、继续播放、历史筛选、收藏管理与本地数据清除。
- 桌面按 375×812 等比例预览，手机端适配窗口。

## 本地运行

使用 Node.js 22.12 或更高版本（推荐 Node.js 24）。

```sh
npm install
npm run dev -- --port 5176
```

开发地址：http://localhost:5176/

## 检查和构建

```sh
npm run typecheck
npm run build
npm run preview
```

构建输出目录为 `dist/`，可用于静态网站托管。

## 部署

Netlify：导入本仓库，构建命令 `npm run build`，发布目录 `dist`。仓库包含 `netlify.toml`。
其他静态托管平台使用相同的构建命令和输出目录。

## 目录

- `src/`：页面、交互及样式。
- `public/assets/`：图标和封面等静态素材。
- `public/fonts/`：本地中文字体。
- `.figma/make/site.json`：Vite 配置所需的页面元数据。

## 演示范围

播放使用模拟进度，尚未接入真实播客音频；AI 摘要、逐字稿和回答为预设演示。
收藏、收听历史与进度保存在当前浏览器的 localStorage 中，不会跨设备同步。
问答记录保留在当前精听页面中，离开页面或刷新会重置。

本仓库用于项目演示。播客封面等素材仅用于还原原型，不代表拥有相关品牌或内容版权。
