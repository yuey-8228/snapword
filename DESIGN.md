# DESIGN.md

> 拍照学英语 Web — 把每次拍照变成一块块亮闪闪的英文糖果，收进你的口袋词卡本。

**项目代号**：SnapWord
**目标用户**：学生、备考族、兴趣学习者；中文母语、需要扩展英文词汇
**核心场景**：移动端优先（375px+），桌面端良好（1280px+）；夜晚学习常见，必须支持暗色
**适用 PRD**：F-02 / F-03 / F-05 / F-06 / F-07 五个核心模块

---

## 1. Visual Theme & Atmosphere

**Style**：青春软糖 Bento（Playful Bento with Y2K touches）
**Keywords**：Bento 网格、软糖色块、圆角胶囊、轻 Y2K、霓虹微光、果冻质感、收集感、轻盈
**Tone**：明亮、活泼、年轻、可触碰 — NOT 严肃、商务、冷峻、信息密集、灰暗
**Feel**：像在玩一台粉粉的复古拍立得，每张词卡都是一颗剥开糖纸的水果硬糖

**Interaction Tier**：L2 流畅交互
- 入场 stagger、卡片 hover lift、轮播弹性切换、收藏图标弹动
- 不上 GSAP/Lenis，CSS transition + Framer Motion 足够
- 减少动效（prefers-reduced-motion）必须降级

**Dependencies**：CSS only + Framer Motion 11 + Tailwind CSS 3.4

---

## 2. Color Palette & Roles

### 亮色（默认）

```css
:root {
  /* Backgrounds — 暖奶油底 + 多层 surface */
  --bg: #FFF8F0;                    /* 页面背景，奶油白 */
  --surface: #FFFFFF;               /* 卡片表面 */
  --surface-alt: #FFF1E6;           /* Bento 次级块 / 区块分隔 */
  --surface-hover: #FFEBD9;         /* 悬停态 */
  --surface-sunken: #F5EDE3;        /* 凹陷区（输入框背景）*/

  /* Borders */
  --border: #F0E1CE;                /* 默认细边 */
  --border-hover: #E8D2B5;          /* 悬停加深 */
  --border-strong: #2D2D44;         /* 强边框（突出 CTA）*/

  /* Text */
  --text: #2D2D44;                  /* 主文字 深紫黑 */
  --text-secondary: #6B6B85;        /* 正文 */
  --text-tertiary: #9C9CAF;         /* 标签、辅助 */
  --text-inverse: #FFFFFF;          /* 反白文字 */

  /* Accent — 四色糖果 */
  --accent: #FF6B9D;                /* 主：草莓粉，CTA/链接/活跃 */
  --accent-hover: #FF4F89;
  --accent-yellow: #FFD93D;         /* 柠檬黄，徽章/装饰 */
  --accent-green: #6BCF7F;          /* 薄荷绿，成功态/已收藏 */
  --accent-purple: #A78BFA;         /* 葡萄紫，词卡本/次级强调 */
  --accent-blue: #74C0FC;           /* 苏打蓝，链接/信息 */

  /* RGB variants for rgba */
  --bg-rgb: 255, 248, 240;
  --accent-rgb: 255, 107, 157;
  --accent-green-rgb: 107, 207, 127;
  --text-rgb: 45, 45, 68;

  /* Semantic */
  --success: var(--accent-green);
  --error: #FF5252;
  --warning: #FFB454;
  --info: var(--accent-blue);

  /* Shadows — 带色调阴影 */
  --shadow-sm: 0 2px 8px rgba(45, 45, 68, 0.04);
  --shadow-md: 0 8px 24px rgba(45, 45, 68, 0.08);
  --shadow-lg: 0 16px 48px rgba(45, 45, 68, 0.12);
  --shadow-candy: 0 8px 0 0 var(--accent);   /* "积木"投影，按钮专用 */
  --shadow-candy-hover: 0 4px 0 0 var(--accent-hover);
}
```

### 暗色

```css
[data-theme="dark"] {
  --bg: #1A1625;                    /* 夜空紫黑 */
  --surface: #251F35;
  --surface-alt: #2D2640;
  --surface-hover: #352D4A;
  --surface-sunken: #1F1A2D;

  --border: #3A3252;
  --border-hover: #4A4068;
  --border-strong: #F5F0FA;

  --text: #F5F0FA;
  --text-secondary: #B8B0CC;
  --text-tertiary: #8B82A0;
  --text-inverse: #1A1625;

  /* Accent 在暗色下饱和度略降，避免刺眼 */
  --accent: #FF7BA8;
  --accent-hover: #FF9CBE;
  --accent-yellow: #FFE066;
  --accent-green: #80D993;
  --accent-purple: #C4B0FF;
  --accent-blue: #8DCBFF;

  --bg-rgb: 26, 22, 37;
  --accent-rgb: 255, 123, 168;
  --accent-green-rgb: 128, 217, 147;
  --text-rgb: 245, 240, 250;

  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 16px 48px rgba(0, 0, 0, 0.5);
  --shadow-candy: 0 8px 0 0 var(--accent);
  --shadow-candy-hover: 0 4px 0 0 var(--accent-hover);
}
```

### Color Rules

- 所有颜色通过 CSS 变量引用，禁止组件内硬编码 hex
- 每个页面主区域**只能用一个强调色作为主导**：识别/上传页 = 粉，词卡轮播 = 多色（每张卡片随机分配粉/绿/紫/黄之一），词卡本 = 紫，收藏 = 粉，详情页 = 跟随该词卡的主色
- 渐变只用于装饰元素（背景模糊光斑、词卡缩略图占位），不用于文字
- 错误态用 `--error`，但 toast 整体仍保持白底彩边而非整块红色
- 暗色下背景层级靠 `surface` 系列变量，禁止用 opacity 模拟分层

---

## 3. Typography Rules

### Font Stack

```css
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap');
```

- **英文标题/单词大字**：`Sora` 800（圆润现代，匹配软糖感）
- **英文正文/UI**：`Inter` 400/500/600（清晰，不抢风头）
- **音标 IPA**：`JetBrains Mono` 500（IPA 字符在等宽字体中对齐最稳）
- **中文**：`Noto Sans SC`（思源黑体），fallback `PingFang SC` / 系统默认
- **降级**：`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

### Scale

| Role | Font | Size (mobile / desktop) | Weight | Line Height | Letter Spacing |
|------|------|------------|--------|-------------|----------------|
| Hero 单词大字 | Sora | 48px / 72px | 800 | 1.1 | -0.02em |
| Page H1 | Sora | 28px / 36px | 700 | 1.2 | -0.01em |
| Section H2 | Sora | 20px / 24px | 700 | 1.3 | -0.005em |
| Card Title (词卡词) | Sora | 32px / 40px | 700 | 1.2 | -0.01em |
| Body | Inter + Noto Sans SC | 15px / 16px | 400 | 1.6 | 0 |
| Body Strong | Inter + Noto Sans SC | 15px / 16px | 600 | 1.6 | 0 |
| Label / 标签 | Inter | 12px / 13px | 500 | 1.4 | 0.04em |
| IPA 音标 | JetBrains Mono | 14px / 16px | 500 | 1.4 | 0 |
| Button | Inter | 15px / 16px | 600 | 1 | 0.01em |
| Tiny / 时间戳 | Inter | 11px / 12px | 500 | 1.4 | 0.04em |

### Typography Rules

- 标题字重 ≥ 700，正文 ≤ 600；通过字重而非字号建立层级
- **中英文混排**：CSS 用 `font-family: 'Inter', 'Noto Sans SC', sans-serif`，浏览器自动按字符类型挑字体
- 中文文字行高 1.7，英文 1.5–1.6
- IPA 音标必须用等宽字体，且**包裹 `/` 和 `/` 也用等宽**
- **NEVER use**：Comic Sans、Papyrus、Arial（无法处理 IPA）、楷体（不专业）
- 禁止 text-shadow 用作文字装饰；禁止用渐变填充文字（除非是装饰性 Hero）
- 单词大字 Hero 可以用 `font-feature-settings: "ss01"` 启用 Sora 的几何变体

### Text Decoration

- Hero 单词：纯实色 + 强字重，不加渐变、不加描边、不加 shadow
- 收藏/已添加状态：色变 + icon 切换，不用下划线
- 链接：默认有颜色（`--accent`），hover 出现下划线 `text-underline-offset: 4px`
- 错误文字：红色 + 左侧小图标，不用全大写

---

## 4. Component Stylings

### Buttons

三种按钮：糖块主按钮（Candy Primary）、轮廓次按钮（Outline）、文字按钮（Ghost）。

```css
/* 糖块主按钮 — 有"积木"投影，按下时投影消失模拟下压 */
.btn-candy {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.01em;
  padding: 14px 28px;
  border-radius: 16px;
  background: var(--accent);
  color: var(--text-inverse);
  border: 2px solid var(--border-strong);
  box-shadow: var(--shadow-candy);
  cursor: pointer;
  transition: transform 120ms ease-out, box-shadow 120ms ease-out, background 180ms;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
}
.btn-candy:hover {
  background: var(--accent-hover);
  transform: translateY(2px);
  box-shadow: var(--shadow-candy-hover);
}
.btn-candy:active {
  transform: translateY(8px);
  box-shadow: 0 0 0 0 var(--accent);
}
.btn-candy:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 3px;
}
.btn-candy:disabled {
  background: var(--border);
  color: var(--text-tertiary);
  box-shadow: 0 8px 0 0 var(--border-hover);
  cursor: not-allowed;
  transform: none;
}

/* 轮廓按钮 */
.btn-outline {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 15px;
  padding: 12px 22px;
  border-radius: 14px;
  background: var(--surface);
  color: var(--text);
  border: 2px solid var(--border);
  transition: border-color 180ms, background 180ms;
  min-height: 44px;
}
.btn-outline:hover {
  border-color: var(--border-hover);
  background: var(--surface-hover);
}
.btn-outline:active { transform: scale(0.98); }
.btn-outline:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}

/* 文字按钮 / 图标按钮 */
.btn-ghost {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  background: transparent;
  color: var(--text-secondary);
  padding: 8px 12px;
  border-radius: 10px;
  border: none;
  transition: background 160ms, color 160ms;
}
.btn-ghost:hover { background: var(--surface-hover); color: var(--text); }
.btn-ghost:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
```

### Cards（词卡 + 列表项）

```css
/* 词卡 — Bento 块感，每个卡有专属强调色 */
.wordcard {
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 24px;
  padding: 28px;
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;
}
.wordcard::before {
  /* 右上角装饰光斑，主色随卡片变 */
  content: '';
  position: absolute;
  top: -40px; right: -40px;
  width: 140px; height: 140px;
  border-radius: 50%;
  background: var(--card-accent, var(--accent));
  opacity: 0.16;
  filter: blur(20px);
  pointer-events: none;
}
.wordcard:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* 词卡本 / 收藏列表项 */
.list-item {
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 18px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: background 160ms, border-color 160ms, transform 160ms;
}
.list-item:hover {
  background: var(--surface-hover);
  border-color: var(--border-hover);
  transform: translateX(4px);
}
.list-item:active { transform: translateX(2px) scale(0.99); }
.list-item:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}
```

### Navigation（顶部 Tab）

```css
.tabbar {
  display: flex;
  gap: 8px;
  padding: 6px;
  background: var(--surface-sunken);
  border-radius: 18px;
  width: fit-content;
}
.tab {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 14px;
  padding: 10px 20px;
  border-radius: 14px;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 200ms, background 200ms, transform 200ms;
  min-height: 40px;
}
.tab[data-active="true"] {
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-sm);
}
.tab:hover:not([data-active="true"]) { color: var(--text); }
```

### Links

```css
.link {
  color: var(--accent);
  text-decoration: none;
  font-weight: 500;
  transition: color 160ms;
}
.link:hover {
  color: var(--accent-hover);
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
}
```

### Tags / Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--surface-alt);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}
.badge[data-variant="pink"]   { background: rgba(255,107,157,0.12); color: var(--accent); border-color: transparent; }
.badge[data-variant="green"]  { background: rgba(107,207,127,0.16); color: #2D8F47; border-color: transparent; }
.badge[data-variant="purple"] { background: rgba(167,139,250,0.16); color: #6D4FCB; border-color: transparent; }
.badge[data-variant="yellow"] { background: rgba(255,217,61,0.20);  color: #A47800; border-color: transparent; }
```

### Toast

```css
.toast {
  position: fixed;
  top: 20px;        /* Web 端按 F-02 规定靠右上 */
  right: 20px;
  background: var(--surface);
  color: var(--text);
  border: 2px solid var(--border);
  border-radius: 14px;
  padding: 12px 20px;
  box-shadow: var(--shadow-lg);
  font-weight: 500;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 1000;
  animation: toastIn 240ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
.toast[data-variant="success"] { border-color: var(--accent-green); }
.toast[data-variant="error"]   { border-color: var(--error); }

@keyframes toastIn {
  from { opacity: 0; transform: translateY(-12px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
```

### Upload Dropzone

```css
.dropzone {
  background: var(--surface);
  border: 2px dashed var(--border-hover);
  border-radius: 24px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: background 200ms, border-color 200ms;
  position: relative;
  overflow: hidden;
}
.dropzone:hover,
.dropzone[data-active="true"] {
  background: var(--surface-hover);
  border-color: var(--accent);
  border-style: solid;
}
```

### Heart / Favorite Icon

```css
.fav-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 160ms, transform 200ms;
}
.fav-btn:hover { background: var(--surface-hover); }
.fav-btn svg { width: 24px; height: 24px; transition: transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1); }
.fav-btn[data-favorited="true"] svg {
  fill: var(--accent);
  stroke: var(--accent);
}
.fav-btn[data-favorited="false"] svg {
  fill: none;
  stroke: var(--text-tertiary);
  stroke-width: 2;
}
.fav-btn:active svg { transform: scale(1.25); }
```

---

## 5. Layout Principles

### Container

- Mobile max-width：100vw，左右 padding 16px
- Tablet max-width：720px，左右 padding 24px
- Desktop max-width：**1080px**（学习类工具不需要太宽），左右 padding 32px
- 详情页/词卡本列表使用更窄变体 **720px**（聚焦阅读）

### Spacing Scale（4px 倍数）

```
4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64 / 80
```

- Section 之间纵向间距：mobile 32px，desktop 48px
- 组件之间：12-16px
- 卡片内 padding：mobile 20px，desktop 28px
- 列表项之间：8-12px

### Grid（首页 Bento）

```css
.bento {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}
.bento__hero       { grid-column: span 6; }
.bento__action-1   { grid-column: span 3; aspect-ratio: 1; }
.bento__action-2   { grid-column: span 3; aspect-ratio: 1; }
.bento__stats      { grid-column: span 6; }

@media (min-width: 768px) {
  .bento { gap: 20px; }
  .bento__hero       { grid-column: span 4; grid-row: span 2; }
  .bento__action-1   { grid-column: span 2; aspect-ratio: auto; }
  .bento__action-2   { grid-column: span 2; aspect-ratio: auto; }
  .bento__stats      { grid-column: span 4; }
}
```

### 词卡轮播布局

- Mobile：100% 宽度卡片，单卡水平滚动，scroll-snap-type: x mandatory
- Desktop：居中容器 720px，单卡 480px，左右露出 80px 邻卡的边缘提示"还有更多"

---

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat | 无阴影，仅边框 | 列表项 default、Tab、输入框 |
| Subtle | `var(--shadow-sm)` | hover 态的列表项 |
| Elevated | `var(--shadow-md)` | 词卡 default、Bento 块 |
| Floating | `var(--shadow-lg)` | 词卡 hover、Toast、弹窗 |
| Candy | `var(--shadow-candy)`（实色"积木"投影） | 主按钮 default |
| Sunken | 无阴影 + `var(--surface-sunken)` 内陷感 | Tabbar 容器、输入框 |

**规则**：
- 同层级 UI 不允许混用不同 elevation；词卡都是 Elevated，列表项都是 Flat
- Candy 投影仅用于主按钮，是品牌识别点
- 暗色模式下不强化阴影，靠 surface 层级建立深度

---

## 7. Animation & Interaction

**Motion Philosophy**：弹性、回弹、自信。糖果该是软的，落地该有"嘭"的一下。

### Tokens

```css
:root {
  --ease-out-cubic: cubic-bezier(0.33, 1, 0.68, 1);
  --ease-out-back:  cubic-bezier(0.34, 1.56, 0.64, 1);   /* 微弹 */
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --dur-fast: 160ms;
  --dur-base: 240ms;
  --dur-slow: 400ms;
}
```

### Entrance Animation

页面进入：root 容器整体 fadeIn 200ms，内部子元素 stagger 60ms。

```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.stagger > * {
  opacity: 0;
  animation: fadeUp var(--dur-base) var(--ease-out-cubic) forwards;
}
.stagger > *:nth-child(1) { animation-delay: 0ms; }
.stagger > *:nth-child(2) { animation-delay: 60ms; }
.stagger > *:nth-child(3) { animation-delay: 120ms; }
.stagger > *:nth-child(4) { animation-delay: 180ms; }
.stagger > *:nth-child(5) { animation-delay: 240ms; }
```

### 关键动效

| 场景 | 效果 | 时长 | Easing |
|------|------|------|--------|
| 词卡轮播切换 | translateX | 300ms | `--ease-out-cubic` |
| 收藏图标点击 | scale 1 → 1.25 → 1 | 240ms | `--ease-out-back` |
| 按钮按下 | translateY + shadow 收缩 | 120ms | linear |
| Toast 入场 | translateY + scale + fade | 240ms | `--ease-out-back` |
| Toast 出场 | fade + 上滑 | 200ms | linear |
| 删除二次确认弹窗 | scale 0.92 → 1 + fade | 240ms | `--ease-out-back` |
| 拍照原图全屏 | scale + opacity | 320ms | `--ease-out-cubic` |
| 识别加载 | 扫描线纵向往返 | 1600ms 循环 | linear |
| 词卡 hover | translateY(-4px) + shadow | 200ms | `--ease-out-cubic` |
| Skeleton 闪烁 | 渐变位移 | 1400ms 循环 | linear |

### 识别加载扫描线（关键动效之一）

```css
.scan-loader {
  position: relative;
  width: 100%;
  height: 240px;
  border-radius: 24px;
  background: var(--surface);
  border: 2px solid var(--border);
  overflow: hidden;
}
.scan-loader::after {
  content: '';
  position: absolute;
  left: 0; right: 0; top: 0;
  height: 4px;
  background: linear-gradient(90deg,
    transparent, var(--accent), transparent);
  box-shadow: 0 0 16px var(--accent);
  animation: scan 1600ms linear infinite;
}
@keyframes scan {
  0%   { top: 0; }
  50%  { top: calc(100% - 4px); }
  100% { top: 0; }
}
```

### Skeleton

```css
.skeleton {
  background: linear-gradient(90deg,
    var(--surface-alt) 25%,
    var(--surface-hover) 50%,
    var(--surface-alt) 75%);
  background-size: 200% 100%;
  animation: shimmer 1400ms linear infinite;
  border-radius: 12px;
}
@keyframes shimmer {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}
```

### Hover & Focus

- 所有可交互元素必须有 hover **和** focus-visible 双状态
- focus 用 `outline: 3px solid var(--accent); outline-offset: 2px;`
- 触屏设备 hover 不消失，但 active scale 0.98 提供按压反馈

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .scan-loader::after { animation: none; opacity: 0.6; }
}
```

---

## 8. Do's and Don'ts

### Do
- 用 Bento 网格组织首页，每个块都是一个"功能糖果"
- 词卡使用 4 种轮换色（粉/绿/紫/黄），让轮播视觉有节奏
- 中英文混排时 font-family 同时声明 Inter 和 Noto Sans SC，浏览器自动分配
- 主按钮用 "Candy" 积木阴影，是品牌识别点
- 收藏图标的弹性回弹是核心反馈，必须用 cubic-bezier(0.34, 1.56, 0.64, 1)
- 所有空状态都给一张暖心插画 + CTA 按钮，引导下一步
- 暗色模式下饱和度略降，避免霓虹刺眼
- 移动端确保所有可点击元素 ≥ 44×44px

### Don't
- ❌ 不用渐变填充正文文字
- ❌ 不在词卡内部用超过 2 个强调色
- ❌ 不用 `box-shadow: 0 0 X rgba(0,0,0,0.X)` 这种通用浅灰阴影；要么 Candy 实色，要么带 surface 色调
- ❌ 不用全大写英文做正文标题（仅 Label/Badge 可以）
- ❌ 不用 Comic Sans / Papyrus / 楷体 / 任何手写 cursive 体（破坏专业感）
- ❌ 不在按钮里嵌套图标 + 长文字 + emoji 三件套，最多两件
- ❌ 不用边框 1px 灰色 + 浅灰背景的"管理后台风"
- ❌ 不在词卡轮播里用淡入淡出，必须是横向位移 + scroll-snap
- ❌ 不让 IPA 音标用变宽字体（Sora/Inter），必须 JetBrains Mono
- ❌ 不滥用 emoji 装饰文字；emoji 只用在空状态插画、词卡装饰光斑、按钮 icon 替代

---

## 9. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | < 640px | 单列、Bento 折叠为 2 列、底部固定 TabBar |
| Tablet | 640-1023px | Bento 4 列、TabBar 顶部 |
| Desktop | ≥ 1024px | Bento 6 列、最大容器 1080px |
| Wide | ≥ 1440px | 居中，最大容器不变，仅 padding 增 |

### Touch Targets

- 最小可点击区域：**44 × 44 px**
- 列表项整行可点击，hit area 内 padding 不少于 12px
- 收藏/喇叭等图标按钮：48×48 真实，视觉 24×24

### Mobile-First 折叠规则

- 顶部 Tab 在 mobile 改为底部 TabBar 风格（首页/词卡本/收藏 3 个 Tab）
- 词卡详情页底部固定操作条（收藏、删除）
- 桌面端右侧不出现侧栏，保持单列叙事
- 输入控件高度移动端 48px，桌面端 44px

### 字号缩放策略

```css
:root {
  font-size: 15px; /* 移动端基准 */
}
@media (min-width: 768px) {
  :root { font-size: 16px; }
}
```

### Safe Area（移动端浏览器）

```css
.page {
  padding-bottom: max(16px, env(safe-area-inset-bottom));
  padding-top: max(16px, env(safe-area-inset-top));
}
```

---

## 10. Implementation Notes（给写代码看的）

### 项目结构建议

```
src/
├── App.tsx
├── main.tsx
├── routes/                  # 各页面
│   ├── HomePage.tsx
│   ├── RecognizePage.tsx    # 上传+识别加载
│   ├── WordCardsPage.tsx    # 词卡轮播（识别结果）
│   ├── WordBookPage.tsx     # 我的词卡本
│   ├── FavoritesPage.tsx
│   └── WordDetailPage.tsx
├── components/
│   ├── WordCard.tsx
│   ├── Button.tsx
│   ├── Toast.tsx
│   ├── ConfirmDialog.tsx
│   ├── EmptyState.tsx
│   ├── TabBar.tsx
│   ├── FavoriteButton.tsx
│   └── SpeakerButton.tsx
├── lib/
│   ├── storage.ts           # LocalStorage 封装（wordbook/favorites/cardCache）
│   ├── recognize.ts         # mock 识别 API（后期替换）
│   ├── tts.ts               # Web Speech API 封装
│   ├── image.ts             # Canvas 压缩 + base64
│   └── ids.ts               # cardId 生成
├── mock/
│   ├── images/              # 预置示例图（10 张）
│   └── dictionary.ts        # 单词词典数据
├── styles/
│   ├── globals.css          # CSS 变量、reset、字体
│   └── tokens.css
└── hooks/
    ├── useFavorites.ts
    ├── useWordBook.ts
    ├── useTheme.ts
    └── useToast.ts
```

### LocalStorage Keys（与 PRD 对齐）

- `user_favorite_cards`：收藏列表（F-05）
- `user_word_book`：我的词卡本（F-06）
- `word_card_cache`：词卡详情缓存（F-07）
- `app_theme`：主题（light/dark/system）
- `app_sort_pref`：收藏排序偏好（会话内即可，但允许持久化）

### Mock 识别 API

`lib/recognize.ts` 暴露 `async recognize(imageBlob): Promise<RecognizeResult>`，内部根据图片哈希返回预置数据；后期接真实 API 时只替换这个函数。

### 路由

使用 React Router 7（或 Wouter 轻量版）。所有路由列表：
- `/` 首页
- `/recognize` 识别加载
- `/cards/:sessionId` 词卡轮播（一次识别一组）
- `/wordbook` 我的词卡本
- `/favorites` 收藏
- `/word/:cardId` 词汇详情

### 国际化

本期只做中文 UI，但所有文案抽到 `src/i18n.ts` 单文件，便于后期扩展。

---

**Phase B 完成。请确认后我进入 Phase C 开始写代码。**
