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

## 第 5 步：粘贴 Token（存本机浏览器，不进源码）
打开已部署的 Pages 链接（或本地 `workspace.html`），**首次进入会弹出「设置云端同步 Token」**：
- 把第 3 步复制的 fine-grained PAT 粘贴进去 → 保存并进入。
- Token **仅保存在当前设备、当前浏览器的 localStorage**（键 `wb_github_pat`），**不会写入公开源码**，因此页面链接外传也读不了、写不了。
- 换设备 / 换浏览器打开时，会再次弹窗要求粘贴（各端各粘一次）。
- 也可在「设置 → 云端同步 Token」里随时查看尾号、重新保存或清除。

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

## 第 8 步（可选）：微信读书同步
如果不需要微信读书数据，可跳过本步。

### 8.1 获取微信读书 Skill API Key
1. 安装微信读书 Skill：按 Skill 提供的指令完成安装并登录（通常需要微信读书账号授权）。
2. 在 Skill 界面点击「获取 API Key」，复制以 `wrk-` 开头的 Key（只显示一次）。

### 8.2 部署 Cloudflare Worker 中转
微信读书网关只允许自家域名跨域，GitHub Pages 无法直接调用，因此需要一个免费 Worker 做透明转发：
1. 登录 https://dash.cloudflare.com/（免费账号即可）。
2. 进入 **Workers & Pages → Create → Worker**，命名为 `weread-proxy`。
3. 进入 Worker 的 **Edit code**，把仓库里的 `weread-worker.js` 完整粘贴进去，点 **Deploy**。
4. 复制 Worker 地址，形如 `https://weread-proxy.xxx.workers.dev/`。

### 8.3 在工作台填写配置
1. 打开工作台 →「设置 → 微信读书同步」。
2. 粘贴 API Key 和 Worker 地址 → 保存配置。
3. 进入「阅读」模块，点击「立即同步」。
4. 同步成功后，书架、阅读报告、阅读计划关联的书籍进度会自动显示。

**安全说明**：Key 与 Worker 地址只保存在当前设备浏览器 localStorage；换设备 / 换浏览器需重新填写。

## 常见问题
- **Q：PAT 泄露怎么办？** A：到 GitHub 吊销旧 token；本机在「设置 → 云端同步 Token」点「清除本机 Token」后重新粘贴新 token 即可（无需改源码、无需重新 push）。
- **Q：图片存哪？** A：`images/`，由 Pages 直接托管，无需额外服务。
- **Q：data.json 太大？** A：打卡按年分片 + 压缩（见设计文档 §7）；单文件仍可用 Git Data API。
- **Q：要存博客？** A：每篇博文存 `posts/` 独立文件。
- **Q：微信读书同步失败？** A：先确认 Worker 地址能在浏览器直接打开（应返回 `method not allowed`）；再检查 Key 是否以 `wrk-` 开头；最后确认 Skill 本身未过期或被吊销。
- **Q：Worker 部署报错 502？** A：Worker 刚部署后可能有几秒到几十秒传播延迟，刷新或重新 Deploy 一次即可。
