# 「阅读」模块重设计方案

> 适用范围：`/Users/yizhige/Documents/work/workspace.html` 中 `id="reading"` 的 `<section>`。
> 设计原则：保持现有紫色系主题，不引入外部依赖，移动端优先 + 桌面响应式。

---

## 1. 设计目标与用户意图

### 用户意图
- 当前阅读模块把「同步入口 / 年度报告 / 书架 / 计划」全部纵向堆叠，信息密度过高。
- 用户明确希望「阅读计划这部分应该做一个 tab 切换」，并参考截图中的简洁表单/列表风格。
- 参考图风格：白色圆角卡片、浅灰背景、两列紧凑表单、全宽紫色主按钮、干净的计划列表。

### 设计目标
1. 将阅读模块按「报告 / 书架 / 计划」组织为 Tab 切换，降低首屏信息噪音。
2. 保留并优化现有年度报告深色卡片风格，让它在 Tab 容器内更协调。
3. 重新设计书架页，参考微信读书卡片样式，提升封面与进度可视化。
4. 重新设计计划页，对齐参考图的简洁圆角表单与列表。
5. 桌面端使用网格/分栏，移动端保持单列。

---

## 2. 信息架构 / Tab 划分

```
┌────────────────────────────────────────────┐
│  阅读                                        │  ← section-title
├────────────────────────────────────────────┤
│  [微信读书同步]  已同步 · 上次同步：08-17    [立即同步]  │  ← 同步状态条（常驻）
├────────────────────────────────────────────┤
│  [ 报告 ] [ 书架 ] [ 计划 ]                  │  ← Tab 切换
├────────────────────────────────────────────┤
│                                              │
│  ██████████████████████████████████████████  │
│  █                                        █  │
│  █           Tab 内容区                   █  │
│  █                                        █  │
│  ██████████████████████████████████████████  │
│                                              │
└────────────────────────────────────────────┘
```

### Tab 说明
| Tab | 内容 | 数据来源 |
| --- | --- | --- |
| **报告** | 年度阅读报告：KPI 大卡、阅读进度分布、TOP10、分类、趋势、成就、作者 | 微信读书同步数据 |
| **书架** | 书籍卡片网格/列表、状态筛选、阅读进度 | 微信读书同步数据 + 本地 `state.books` |
| **计划** | 添加计划表单 + 计划列表，支持勾选完成/删除 | 本地 `state.readingPlans` |

### 同步入口位置
- 放在 Tab 上方作为**常驻状态条**，因为同步结果同时影响「报告」和「书架」两个 Tab。
- 若未配置或无可同步数据，状态条提示配置信息；有数据后显示上次同步时间。

---

## 3. 各 Tab 布局草图

### 3.1 报告 Tab（年度报告风格）

保持现有深色渐变卡片 `.read-report-card`，微调以融入 Tab 容器。

```
┌────────────────────────────────────────────────────────────┐
│  2026                                                        │
│  年度阅读报告                                                │
│  来自微信读书 · 同步于 08-17 14:32                           │
├────────────────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│  │ 128h │ │  92  │ │  34  │ │  12  │ │  56  │ │  7   │    │
│  │阅读时长│ │阅读天数│ │读过本数│ │ 已读完 │ │ 笔记数 │ │连续天数│   │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘    │
├────────────────────────────────────────────────────────────┤
│  [████░░░░░░░░░░ 进度分布图例]                               │
├────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │ 🏆 TOP10 排行        │  │ 📚 偏好分类          │          │
│  │ 1. 三体    24h      │  │ 科幻  ████████ 12h  │          │
│  │ 2. 围城    18h      │  │ 历史  ██████   8h   │          │
│  │ ...                 │  │ 📈 历年趋势          │          │
│  │                     │  │ ▁▂▄▆█              │          │
│  └─────────────────────┘  └─────────────────────┘          │
├────────────────────────────────────────────────────────────┤
│  🌟 累计成就：128h / 34本 / 56笔记                           │
├────────────────────────────────────────────────────────────┤
│  ✍️ 偏好作者                                                 │
│  [刘] 刘慈欣  3本 · 30h    [钱] 钱钟书  1本 · 18h          │
└────────────────────────────────────────────────────────────┘
```

### 3.2 书架 Tab

顶部放「状态筛选 pills」和「书架小统计」，下方是书籍卡片网格。

```
┌────────────────────────────────────────────────────────────┐
│  [ 全部 ] [ 想读 ] [ 在读 ] [ 读完 ]                         │
│  共 34 本 · 已读完 12 · 在读 8 · 想读 14                    │
├────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ ┌──┐         │  │ ┌──┐         │  │ ┌──┐         │      │
│  │ │封│ 三体    │  │ │封│ 围城    │  │ │封│ ...     │      │
│  │ │面│ 刘慈欣  │  │ │面│ 钱钟书  │  │ │封│         │      │
│  │ └──┘ 在读 45%│  │ └──┘ 读完   │  │ └──┘ 想读   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                  桌面端 3 列 / 平板 2 列 / 手机 1 列        │
└────────────────────────────────────────────────────────────┘
```

### 3.3 计划 Tab（对齐参考图）

上方「阅读计划」卡片放表单，下方「计划列表」卡片放列表。

```
┌────────────────────────────────────────────────────────────┐
│  阅读计划                                                    │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ 书名             │  │ 年 / 月 / 日     │                │
│  └──────────────────┘  └──────────────────┘                │
│  ┌──────────────────────────────────────────┐              │
│  │ 未开始 ▼                                  │              │
│  └──────────────────────────────────────────┘              │
│  ┌──────────────────────────────────────────┐              │
│  │ 备注（可选）                              │              │
│  └──────────────────────────────────────────┘              │
│  ┌──────────────────────────────────────────┐              │
│  │           添加计划（紫色主按钮）          │              │
│  └──────────────────────────────────────────┘              │
└────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│  计划列表                                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ○  置身事内           截止 2026-09-01  删除          │  │
│  │    备注：每天读一章                                    │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ✓  三体（已完成划线） 截止 2026-08-10  删除          │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## 4. 推荐 CSS 类名与样式变量

### 4.1 复用现有变量（已存在于 `:root`）

| 变量 | 值 | 用途 |
| --- | --- | --- |
| `--primary` | `#8B7DC0` | 主按钮、激活 Tab、进度条、状态高亮 |
| `--primary-light` | `#EDE9F8` | Tab 背景、选中态背景、空封面背景 |
| `--primary-soft` | `#C4B9E6` | 焦点边框、悬停色 |
| `--bg` | `#F8F6FC` | 页面背景 |
| `--card` | `#FFFFFF` | 卡片背景 |
| `--text` | `#3D3A45` | 主文字 |
| `--text-secondary` | `#7C7787` | 次要文字 |
| `--border` | `#E8E4F0` | 边框、输入框边框 |
| `--green` / `--green-bg` | `#7EC49A` / `#E6F4EC` | 完成/已读完状态 |
| `--yellow` / `--yellow-bg` | `#E6C068` / `#FDF3DE` | 想读/已完成状态 |
| `--red` / `--red-bg` | `#E06C75` / `#FCE8EA` | 删除按钮 |
| `--shadow` | `0 2px 10px rgba(75,60,115,0.06)` | 卡片阴影 |

### 4.2 推荐新增 CSS 类（追加到现有 `<style>` 末尾）

```css
/* ===== 阅读模块 Tab ===== */
.reading-tabs { margin-bottom: 16px; }
.reading-tab-list {
  display: inline-flex;
  gap: 6px;
  background: var(--primary-light);
  border-radius: 14px;
  padding: 5px;
}
.reading-tab {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  padding: 8px 18px;
  border-radius: 10px;
  cursor: pointer;
  transition: all .2s ease;
}
.reading-tab:hover { color: var(--primary); }
.reading-tab.active {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 2px 8px rgba(139,125,192,.25);
}

.reading-panel { display: none; }
.reading-panel.active { display: block; animation: readingFadeIn .25s ease; }
@keyframes readingFadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ===== 同步状态条优化 ===== */
.weread-sync-card { padding: 14px 16px; }
.weread-sync-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

/* ===== 书架筛选 pills ===== */
.bookshelf-filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
.bookshelf-filter {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  background: var(--primary-light);
  color: var(--primary);
  border: none;
  cursor: pointer;
  transition: all .15s;
}
.bookshelf-filter.active { background: var(--primary); color: #fff; }
.bookshelf-summary { font-size: 12px; color: var(--text-secondary); margin-bottom: 14px; }

/* ===== 书架网格 ===== */
.bookshelf-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 14px;
}
@media (min-width: 640px) { .bookshelf-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .bookshelf-grid { grid-template-columns: repeat(3, 1fr); } }

/* ===== 书籍卡片 V2（微信读书风格） ===== */
.book-card-v2 {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
  transition: transform .15s, box-shadow .15s;
}
.book-card-v2:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
.book-cover-v2 {
  width: 56px; height: 78px;
  object-fit: cover;
  border-radius: 8px;
  background: var(--primary-light);
  flex: 0 0 56px;
}
.book-body-v2 { flex: 1; min-width: 0; }
.book-title-v2 {
  font-weight: 700;
  font-size: 15px;
  color: var(--text);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.book-author-v2 {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.book-progress-v2 { margin-top: 10px; }
.book-progress-track {
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}
.book-progress-fill { height: 100%; background: var(--primary); border-radius: 3px; }
.book-progress-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 5px;
}
.book-tag-v2 {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 10px;
  margin-top: 8px;
}
.book-tag-v2.want { background: var(--yellow-bg); color: var(--yellow); }
.book-tag-v2.reading { background: var(--primary-light); color: var(--primary); }
.book-tag-v2.done { background: var(--green-bg); color: var(--green); }

/* ===== 阅读计划表单（对齐参考图） ===== */
.rp-form-row { display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
.rp-form-row .rp-input { flex: 1; min-width: 140px; }
.rp-input, .rp-select, .rp-textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 15px;
  background: #fff;
  color: var(--text);
  outline: none;
  box-sizing: border-box;
}
.rp-input:focus, .rp-select:focus, .rp-textarea:focus { border-color: var(--primary-soft); }
.rp-textarea { resize: vertical; min-height: 76px; }
.rp-submit { width: 100%; margin-top: 4px; }

/* ===== 计划列表项（优化） ===== */
.plan-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 10px;
}
.plan-check {
  width: 22px; height: 22px;
  border-radius: 50%;
  border: 2px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex: 0 0 22px; margin-top: 2px;
  transition: all .15s;
}
.plan-check.done { background: var(--green); border-color: var(--green); }
.plan-check svg { width: 14px; height: 14px; stroke: #fff; stroke-width: 3; fill: none; }
.plan-info { flex: 1; min-width: 0; }
.plan-title { font-weight: 600; color: var(--text); }
.plan-title.done { text-decoration: line-through; color: var(--text-secondary); }
.plan-meta { font-size: 12px; color: var(--text-secondary); margin-top: 3px; }
.plan-link { color: var(--primary); font-weight: 600; }
.plan-note { font-size: 12px; color: var(--text-secondary); margin-top: 6px; white-space: pre-wrap; word-break: break-word; }
.plan-actions { display: flex; gap: 8px; }
```

### 4.3 尺寸与间距速查

| 元素 | 推荐值 | 说明 |
| --- | --- | --- |
| Tab 背景圆角 | `14px` | 胶囊形容器 |
| Tab 项圆角 | `10px` | 胶囊按钮 |
| Tab 项 padding | `8px 18px` | 紧凑可点击 |
| 卡片圆角 | `16px` / `18px` | 与现有 `.card` 一致 |
| 输入框圆角 | `12px` | 与全局表单一致 |
| 输入框 padding | `12px 14px` | 参考图简洁风格 |
| 表单行间距 | `12px` | 紧凑 |
| 书架网格间距 | `14px` | 卡片呼吸感 |
| 书籍封面 | `56px × 78px` | 微信读书比例 |
| 计划卡片 padding | `14px` | 与现有 `.plan-card` 一致 |
| 主按钮 | `btn btn-primary rp-submit` | 全宽、紫色、圆角 `12px` |

---

## 5. 关键 HTML 结构示例

### 5.1 阅读 Section 整体骨架

```html
<section class="section" id="reading">
  <div class="section-header">
    <h2 class="section-title">阅读</h2>
  </div>

  <!-- 同步状态条（常驻） -->
  <div class="card weread-sync-card">
    <div class="weread-sync-bar">
      <div>
        <div class="weread-sync-status" id="wereadSyncStatus">未同步</div>
        <div class="weread-sync-meta" id="wereadSyncMeta">首次使用请先在「设置」里保存 Key 和 Worker 地址</div>
      </div>
      <button class="btn btn-primary btn-small" id="wereadSyncBtn">立即同步</button>
    </div>
  </div>

  <!-- Tab 切换 -->
  <div class="reading-tabs">
    <div class="reading-tab-list" role="tablist">
      <button class="reading-tab active" data-tab="report" role="tab" aria-selected="true">报告</button>
      <button class="reading-tab" data-tab="bookshelf" role="tab" aria-selected="false">书架</button>
      <button class="reading-tab" data-tab="plan" role="tab" aria-selected="false">计划</button>
    </div>
  </div>

  <!-- 报告面板 -->
  <div class="reading-panel active" id="tab-report" role="tabpanel">
    <div class="read-report-card" id="readStatsCard" style="display:none;">
      <!-- 保留现有 rr-* 结构 -->
    </div>
    <div class="card" id="readStatsEmpty">
      <div class="empty-state">暂无微信读书数据，点击上方「立即同步」生成报告。</div>
    </div>
  </div>

  <!-- 书架面板 -->
  <div class="reading-panel" id="tab-bookshelf" role="tabpanel">
    <div class="card">
      <div class="bookshelf-filters" id="bookshelfFilters">
        <button class="bookshelf-filter active" data-filter="all">全部</button>
        <button class="bookshelf-filter" data-filter="想读">想读</button>
        <button class="bookshelf-filter" data-filter="在读">在读</button>
        <button class="bookshelf-filter" data-filter="读完">读完</button>
      </div>
      <div class="bookshelf-summary" id="bookshelfSummary">共 0 本</div>
      <div class="bookshelf-grid" id="bookshelfGrid"></div>
      <div class="empty-state" id="bookshelfEmpty">书架空空如也，同步微信读书后会显示在这里。</div>
    </div>
  </div>

  <!-- 计划面板 -->
  <div class="reading-panel" id="tab-plan" role="tabpanel">
    <div class="card reading-plan-card">
      <div class="card-title">阅读计划</div>
      <form id="addReadingPlanForm">
        <div class="rp-form-row">
          <input type="text" name="rpTitle" class="rp-input" placeholder="书名" required>
          <input type="date" name="rpDue" class="rp-input">
        </div>
        <div class="rp-form-row">
          <select name="rpStatus" class="rp-select">
            <option value="未开始">未开始</option>
            <option value="进行中">进行中</option>
            <option value="已完成">已完成</option>
          </select>
        </div>
        <div class="rp-form-row">
          <textarea name="rpNote" class="rp-textarea" placeholder="备注（可选）" rows="2"></textarea>
        </div>
        <button type="submit" class="btn btn-primary rp-submit">添加计划</button>
      </form>
    </div>

    <div class="card">
      <div class="card-title">计划列表</div>
      <div id="readingPlanList"></div>
      <div class="empty-state" id="readingPlanEmpty">还没有阅读计划，添加一个吧～</div>
    </div>
  </div>
</section>
```

### 5.2 书架卡片渲染模板

```html
<!-- 渲染用模板（由 JS 动态生成） -->
<div class="book-card-v2">
  <img class="book-cover-v2" src="{{cover}}" alt="">
  <div class="book-body-v2">
    <div class="book-title-v2">{{title}}</div>
    <div class="book-author-v2">{{author}} · {{category}} · 笔记 {{noteCount}}</div>
    <div class="book-progress-v2">
      <div class="book-progress-track">
        <div class="book-progress-fill" style="width:{{progress}}%"></div>
      </div>
      <div class="book-progress-meta">
        <span>{{status}}</span>
        <span>{{progress}}%</span>
      </div>
    </div>
    <span class="book-tag-v2 {{statusClass}}">{{status}}</span>
  </div>
</div>
```

### 5.3 计划列表项渲染模板

```html
<!-- 渲染用模板（由 JS 动态生成） -->
<div class="plan-item">
  <div class="plan-check {{doneClass}}">
    {{checkSvg}}
  </div>
  <div class="plan-info">
    <div class="plan-title {{doneClass}}">{{title}}</div>
    <div class="plan-meta">
      {{due}}
      {{#matched}}
        · <span class="plan-link">已在书架</span> · {{matchedStatus}}
      {{/matched}}
    </div>
    {{#note}}<div class="plan-note">{{note}}</div>{{/note}}
  </div>
  <div class="plan-actions">
    <button class="btn btn-small btn-danger act-del">删除</button>
  </div>
</div>
```

---

## 6. JS 交互要点

### 6.1 Tab 切换

```js
function initReadingTabs() {
  var tabs = document.querySelectorAll('.reading-tab');
  var panels = document.querySelectorAll('.reading-panel');
  tabs.forEach(function(tab){
    tab.addEventListener('click', function(){
      var target = tab.dataset.tab;
      tabs.forEach(function(t){ t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      panels.forEach(function(p){ p.classList.remove('active'); });
      tab.classList.add('active'); tab.setAttribute('aria-selected', 'true');
      document.getElementById('tab-' + target).classList.add('active');
      // 可选：记住当前 tab
      try { localStorage.setItem('wb_reading_active_tab', target); } catch(e){}
    });
  });
  // 恢复上次选中 tab
  try {
    var last = localStorage.getItem('wb_reading_active_tab');
    if (last) {
      var t = document.querySelector('.reading-tab[data-tab="' + last + '"]');
      if (t) t.click();
    }
  } catch(e){}
}
```

### 6.2 `renderReading()` 拆分建议

将原有 `renderReading()` 拆分为三个独立渲染函数，由 `renderReading()` 统一调用：

```js
function renderReading() {
  renderReadingSyncBar();   // 同步状态条
  renderReadingReport();    // 报告面板
  renderBookshelf();        // 书架面板
  renderReadingPlans();     // 计划面板
}
```

- `renderReadingReport()`：复用现有报告渲染逻辑，控制 `#readStatsCard` / `#readStatsEmpty` 显示。
- `renderBookshelf()`：根据 `state.books` 和当前筛选状态渲染 `.bookshelf-grid`。
- `renderReadingPlans()`：复用现有计划列表渲染逻辑，更新列表项 DOM 结构为新 `.plan-item`。

### 6.3 书架筛选交互

```js
var bookshelfFilter = 'all';
function initBookshelfFilters() {
  document.querySelectorAll('.bookshelf-filter').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.bookshelf-filter').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      bookshelfFilter = btn.dataset.filter;
      renderBookshelf();
    });
  });
}

function renderBookshelf() {
  var books = state.books.slice().sort(function(a,b){ return (b.readTime||0)-(a.readTime||0); });
  if (bookshelfFilter !== 'all') {
    books = books.filter(function(b){ return b.status === bookshelfFilter; });
  }
  // 更新统计
  var total = state.books.length;
  var done = state.books.filter(function(b){ return b.status === '读完'; }).length;
  var reading = state.books.filter(function(b){ return b.status === '在读'; }).length;
  var want = state.books.filter(function(b){ return b.status === '想读'; }).length;
  // ... 渲染 grid
}
```

### 6.4 计划表单

保持现有事件绑定，仅调整 DOM 查询：

```js
document.getElementById('addReadingPlanForm').onsubmit = function(e){
  e.preventDefault();
  var f = e.target;
  wrapPromise(addReadingPlan(
    f.rpTitle.value.trim(),
    f.rpDue.value,
    f.rpStatus.value,
    f.rpNote.value.trim()
  )).then(function(){ f.reset(); loadAll(); });
};
```

### 6.5 同步后自动刷新

`syncWeread()` 成功后继续调用 `renderReading()`，三个面板同步更新。

---

## 7. 避免的事项

1. **不要引入外部库**：不使用 Tailwind、Bootstrap、Chart.js 等，全部用内联 CSS/JS。
2. **不要做大风格跳跃**：年度报告保持深色渐变；书架/计划保持浅色卡片，与全局紫色系一致。
3. **不要删除现有数据字段**：`state.books`、`state.readStats`、`state.readingPlans`、`state.notebooks` 等结构保持不变。
4. **不要改变同步入口行为**：只在视觉上压缩为「状态条」，逻辑完全复用 `syncWeread()`。
5. **不要破坏响应式**：书架网格必须在手机端回到单列，避免横向滚动。
6. **不要过度设计动画**：仅保留 Tab 淡入和卡片悬停微动效，避免干扰阅读。
7. **不要混淆状态语义**：「已完成」用于阅读计划，「读完」用于书架书籍，保持原字段不变。
8. **不要修改 `workspace.html` 源文件**：本方案仅作为设计文档，供后续开发参考落地。

---

## 8. 落地建议顺序

1. 追加新增 CSS 到 `<style>` 末尾。
2. 替换 `id="reading"` 的 HTML 为本文 5.1 的 Tab 结构。
3. 拆分 `renderReading()` 为 4 个子函数。
4. 实现书架筛选与卡片渲染。
5. 更新计划列表 DOM 模板为 `.plan-item`。
6. 添加 Tab 切换与本地记忆。
7. 在移动端和桌面端分别验证布局。
