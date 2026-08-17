# 部署指南（单仓库方案）

## 第 1 步：建 GitHub 仓库
新建 **Public** 仓库（本方案用 public，Pages 现对 private 也免费，二选一），如 `work`。

## 第 2 步：启用 GitHub Pages
仓库 **Settings → Pages → Source** 选 `main` 分支 `/ (root)` → Save。记下 Pages 地址 `https://yizhigee.github.io/work/`。

## 第 3 步：建 fine-grained PAT（仅本仓库）
**GitHub → Settings → Developer settings → Fine-grained tokens → 生成**：
- Repository access：只选本仓库 `work`
- Permissions → Repository contents：**Read and Write**
- 生成并复制 token（只显示一次）。

## 第 4 步：准备初始 data.json
仓库里放一个 `data.json` 初始空结构（见《设计开发文档.md》§4），首次提交带进去。

## 第 5 步：部署 Cloudflare Worker 网关（统一保管凭证）
本方案把 GitHub PAT 与微信读书 Key 都放在 Worker 环境变量，前端 `workspace.html` 零 token。因此 Worker 是必需的（不再「可选」）。

1. 登录 https://dash.cloudflare.com/（免费账号即可）。
2. **Workers & Pages → Create → Worker**，命名为 `weread-proxy`。
3. 进入 Worker 的 **Edit code**，把仓库里的 `weread-worker.js` 完整粘贴进去，点 **Deploy**。
4. **Settings → Variables**（环境变量）添加以下项：
   - `GITHUB_PAT`：第 3 步复制的 fine-grained PAT
   - `GITHUB_OWNER`：`yizhigee`
   - `GITHUB_REPO`：`work`
   - `GITHUB_BRANCH`：`main`
   - `GITHUB_DATA_FILE`：`data.json`
   - `WEREAD_KEY`：微信读书 Skill API Key（以 `wrk-` 开头；不需要微信读书同步可留空，但变量仍建议建）
   - `APP_KEY`：`workbench-gate-2026`（必须与 `workspace.html` 里的 `APP_KEY` 常量一致）
5. 保存变量后**再次 Deploy** 使环境变量生效。复制 Worker 地址，形如 `https://weread-proxy.xxx.workers.dev/`。
6. 确认 `workspace.html` 顶部 `WORKER_URL` 常量与该地址一致（本仓库已预填 `weread-proxy.lucky888312.workers.dev`，若你自建 Worker 需同步改这一行）。

> 前端不再有「粘贴 Token / Key」的弹窗或设置项；所有凭证都在 Worker 后台。换设备 / 换浏览器无需重新配置。

## 第 6 步：push 到仓库
```bash
git clone https://github.com/yizhigee/work.git
cd work
# 把 workspace.html / data.json / 本指南等拷进来
git add .
git commit -m "部署成长工作台"
git push -u origin main
```

## 第 7 步：验证
打开 Pages 链接 → 添加一条待办 → 刷新页面，数据仍在 = 成功。

## 第 7 步：验证
打开 Pages 链接 → 添加一条待办 → 刷新页面，数据仍在 = 成功（说明 Worker 网关读写 data.json 正常）。

## 第 8 步（可选）：微信读书同步
微信读书 Key 已在第 5 步写入 Worker 环境变量 `WEREAD_KEY`，无需在工作台再填。
1. 进入工作台「设置 → 微信读书同步」，点「立即同步」。
2. 同步成功后，书架、阅读报告、阅读计划关联的书籍进度会自动显示。

## 常见问题
- **Q：PAT 泄露怎么办？** A：到 GitHub 吊销旧 token，并在 Cloudflare Worker 后台把 `GITHUB_PAT` 更新为新值后重新 Deploy 即可（无需改前端源码、无需重新 push 前端）。
- **Q：图片存哪？** A：`images/`，写经 Worker `/api/image`，读由 Pages 直接托管，无需额外服务。
- **Q：data.json 太大？** A：打卡按年分片 + 压缩（见设计文档 §7）；单文件仍可用 Git Data API。
- **Q：要存博客？** A：每篇博文存 `posts/` 独立文件。
- **Q：微信读书同步失败？** A：先确认 Worker 地址能在浏览器直接打开（应返回 `ok` 健康检查 JSON）；再检查 `WEREAD_KEY` 是否以 `wrk-` 开头且 Skill 未过期；最后确认 `APP_KEY` 前后端一致。
- **Q：Worker 部署报错 502？** A：Worker 刚部署后可能有几秒到几十秒传播延迟，刷新或重新 Deploy 一次即可。
- **Q：换设备还要重新配置吗？** A：不需要。凭证都在 Worker 后端，前端打开即用，零配置。
