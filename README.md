# 个人成长工作台

紫系极简卡片风的个人成长 / 生活管理工作台。单人使用，网页 / 手机 / 平板三端同步，**零成本、无服务器**。

## 模块
- 已上线：首页 / 打卡 / 待办 / 番茄钟 / 阅读 / 健身 / 纪念日 / 随笔 / 统计 / 设置
- 规划中：博客（公开博文）

## 技术架构（一句话）
单一 GitHub 仓库（`workspace.html` + `data.json` + `images/` + `posts/`）经 GitHub Pages 托管；fine-grained PAT（仅本仓库 Contents）由用户在首次打开时粘贴、存于本机浏览器，负责数据 / 图片 / 博文的读写。无后端、免费。

## 快速开始
1. 看 [setup.md](./setup.md) 完成仓库 / Pages / PAT / 部署。
2. 打开 https://yizhigee.github.io/work/workspace.html 即可使用（需先在仓库 Settings → Pages 启用 main 分支）。

## 安全提示
PAT 存于本机浏览器（localStorage，键 `wb_github_pat`），源码不含明文；页面链接外传也无法读写。详见《设计开发文档.md》安全。

## 文档导航
- `overview.md`：需求与方案总览
- `设计开发文档.md`：技术架构
- `setup.md`：部署指南
