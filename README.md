# 个人成长工作台

紫系极简卡片风的个人成长 / 生活管理工作台。单人使用，网页 / 手机 / 平板三端同步，**零成本、无服务器**。

## 模块
- 已上线：首页 / 打卡 / 待办 / 番茄钟 / 阅读 / 健身 / 纪念日 / 随笔 / 统计 / 设置
- 规划中：博客（公开博文）

## 技术架构（一句话）
单一 GitHub 仓库（`workspace.html` + `data.json` + `images/` + `posts/`）经 GitHub Pages 托管；GitHub PAT 与微信读书 Key **统一托管在 Cloudflare Worker 环境变量**（`weread-worker.js` 作统一后端网关），前端 `workspace.html` 零 token、零 localStorage 密钥，只持 Worker 地址 + 轻量 APP_KEY 闸门。数据 / 图片读写与微信读书同步全部经该 Worker 转发鉴权。免费、无自有服务器。

## 快速开始
1. 看 [setup.md](./setup.md) 完成仓库 / Pages / Worker 部署与环境变量配置。
2. 打开 https://yizhigee.github.io/work/workspace.html 即可使用（需先在仓库 Settings → Pages 启用 main 分支，并在 Worker 后台填入环境变量）。

## 安全提示
- GitHub PAT 与微信读书 Key **仅存于 Cloudflare Worker 环境变量**（后台设置），不进仓库源码、不下发浏览器、不写 localStorage。
- 前端只持有公开的 Worker 地址与一个轻量 APP_KEY 闸门（非有权限凭证，仅挡随机滥用）；即使页面链接 / 源码外传也拿不到任何可写凭证。
- 详见《设计开发文档.md》安全。

## 文档导航
- `overview.md`：需求与方案总览
- `设计开发文档.md`：技术架构
- `setup.md`：部署指南
