# 个人成长工作台 · 需求与方案总览

> 文档纪律：本仓库文档只呈现**最终方案**，不含变更记录。代码改动须同步更新本文件与《设计开发文档.md》《README.md》《setup.md》。

## 1. 项目定位
- 单人使用的个人成长 / 生活管理工作台。
- 视觉：紫色系、低饱和、极简卡片风；左侧垂直导航。
- 终端：网页 / 手机 / 平板，**三端同一链接、数据同步**。
- 唯一硬指标：**零货币成本（免费）**。GitHub PAT 与微信读书 Key **统一托管在 Cloudflare Worker 环境变量（后端）**，前端 `workspace.html` 零 token、零 localStorage 密钥，只持有 Worker 地址与一个轻量 APP_KEY 闸门（非有权限凭证）。换设备 / 换浏览器无需重新配置，且公开源码 / 页面链接外传也拿不到任何可写凭证。

## 2. 功能模块（需求基线）
| 模块 | 状态 | 说明 |
|---|---|---|
| 首页 | ✅ 已上线 | 概览卡片、昵称 / 签名、快捷入口 |
| 打卡 | ✅ 已上线 | 习惯管理 + 每日打卡 + 日历 |
| 待办 | ✅ 已上线 | 增删改查、状态 / 优先级 / 标签 / 截止 |
| 番茄钟 | ✅ 已上线 | 计时 + 专注记录 |
| 设置 | ✅ 已上线 | 昵称 / 签名 / 模块顺序 / 番茄默认 / 清空 |
| 阅读 | ✅ 已上线 | 微信读书同步书架 + 阅读计划 + 阅读报告 |
| 健身 | ✅ 已上线 | 训练计划 / 记录（可能含对比图） |
| 纪念日 | ✅ 已上线 | 日期提醒 |
| 随笔 | ✅ 已上线 | 短笔记（可能含配图） |
| 统计 | ✅ 已上线 | 多模块数据聚合可视化 |
| 博客 | 🔜 规划中 | 公开博文，独立文件存储（扩展模块） |

## 3. 最终技术选型（定稿）
- **单一 GitHub 仓库 + GitHub Pages，无后端服务器。**
- 仓库内容：
  - `workspace.html`：单文件前端应用（内联 CSS/JS/SVG，零外部依赖）。
  - `data.json`：结构化数据（习惯 / 打卡 / 待办 / 番茄 / 设置 / 各模块 key / 微信读书同步数据）。
  - `images/`：图片资源（健身对比、随笔配图等），由 Pages 静态托管。
  - `posts/`：博文独立文件（未来博客模块）。
  - `weread-worker.js`：统一后端网关（Cloudflare Worker）。持有全部密钥（GitHub PAT / 微信读书 Key），对外暴露 `/api/data`、`/api/image`、`/api/weread`、`/` 四个端点，并做 APP_KEY 闸门与 CORS。前端零 token。
- **GitHub 鉴权**：fine-grained PAT，**仅授权本仓库**的 `Contents: Read and Write`，存放在 Cloudflare Worker 环境变量（后台设置），**不进仓库源码、不下发浏览器、不写 localStorage**。前端所有读写经 Worker 网关转发。
- **微信读书鉴权**：微信读书 Skill API Key 同样只存 Worker 环境变量；前端 `wereadFetch` 只把 `api_name` + 参数发给 Worker，由 Worker 注入 `Authorization: Bearer <Key>` 后转发 `i.weread.qq.com`，返回原始 JSON。
- 读取与写入均经 Worker 网关（`/api/data` GET/PUT `data.json`、`/api/image` PUT/DELETE 图片），前端持有 APP_KEY 闸门头做轻量防滥用。

## 4. 选型对照（否决项）
- 不用 WorkBuddy 资料库：移动端删改需微信授权、有登录摩擦 → 否决。
- 不用纯 Gist：单文件 1 MB 上限且存图困难 → 否决，统一进仓库。
- 不用 Cloudflare Worker / 自架服务器做核心业务：免费场景不解决安全-零登录矛盾，且增维护成本 → 基础否决；**例外**：因微信读书网关跨域限制与「公开 Pages + 写凭证」不可兼得的矛盾，最终采用「免费 Worker 统一保管凭证 + 前端零 token」方案（用户已确认接受），Worker 仅作 API 网关与 CORS 中转，不承载业务逻辑。
- 不用外部图床：引入第三方依赖与 ToS 风险 → 仅在「坚决不扩 PAT 权限」时作为退路。

## 5. 满足的核心需求
- **三端增删改查 + 同步**：任意设备浏览器开同一 Pages 链接，数据落在同一仓库。
- **无感操作**：凭证集中在 Worker 后端，前端打开即用，无微信授权、无每次登录、无首次粘贴弹窗；换设备 / 换浏览器无需重新配置。
- **免费**：GitHub Pages + 仓库 + API 全部免费。
- **可扩展**：加模块 = 加 UI + 加 `data.json` key + 复用 API 层；图片复用 `images/`；博客用 `posts/`；微信读书等外部数据通过 Worker 中转接入。

## 6. 容量与扩展策略
- `data.json` 单文件上限 1 MB（Contents API）：时间序列（打卡）按年分片 + 位串压缩，十年 × 30 习惯也压不破。
- 图片：客户端 canvas 压缩后存入 `images/`，单文件 ≤ 1 MB，个人用远不到仓库软上限。
- 博文：每篇独立文件，收纳于 `posts/`，不占 `data.json` 额度。
- 逃生舱：若需单文件 > 1 MB，改用 Git Data API（blob 100 MB）。
- 详见《设计开发文档.md》§7 容量策略。

## 7. 当前实施状态
- 前端 10 模块已全部上线，数据层已迁移至仓库 Contents API（`/api/data` 经 Worker 网关读写），`images/` 上传压缩已实现；凭证统一托管到 Cloudflare Worker 环境变量（GitHub PAT / 微信读书 Key），前端零 token、零 localStorage 密钥，加 APP_KEY 闸门；微信读书同步（书架 / 阅读统计 / 笔记）+ 阅读计划 + 阅读报告已接入，经 Worker 网关鉴权转发。
- 文档体系：`README.md`（入口）→ `overview.md`（需求）→ `设计开发文档.md`（技术）→ `setup.md`（部署）。
