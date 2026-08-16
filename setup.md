# 部署指南（单仓库方案）

## 第 1 步：建 GitHub 仓库
新建 **Public** 仓库（Pages 免费需 public），如 `workbench`。

## 第 2 步：启用 GitHub Pages
仓库 **Settings → Pages → Source** 选 `main` 分支 `/ (root)` → Save。记下 Pages 地址 `https://yizhigee.github.io/work/`。

## 第 3 步：建 fine-grained PAT（仅本仓库）
**GitHub → Settings → Developer settings → Fine-grained tokens → 生成**：
- Repository access：只选本仓库 `workbench`
- Permissions → Repository contents：**Read and Write**
- 生成并复制 token（只显示一次）。

## 第 4 步：准备初始 data.json
仓库里放一个 `data.json` 初始空结构（见《设计开发文档.md》§4），首次提交带进去。

## 第 5 步：填 CONFIG
编辑 `workspace.html` 顶部：
```js
CONFIG = {
  OWNER:       'yizhigee',
  REPO:        'work',
  BRANCH:      'main',
  DATA_FILE:   'data.json',
  GITHUB_TOKEN: '上一步的 token'
}
```

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

## 常见问题
- **Q：PAT 泄露怎么办？** A：立即吊销旧 token，重新生成（仅本仓库）并替换 `CONFIG.GITHUB_TOKEN` 后 push。
- **Q：图片存哪？** A：`images/`，由 Pages 直接托管，无需额外服务。
- **Q：data.json 太大？** A：打卡按年分片 + 压缩（见设计文档 §7）；单文件仍可用 Git Data API。
- **Q：要存博客？** A：每篇博文存 `posts/` 独立文件。
