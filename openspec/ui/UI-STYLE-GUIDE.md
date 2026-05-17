# WannaSing UI 设计规范

> 本文档定义了 WannaSing 项目的 UI 设计语言，确保所有页面保持一致的设计风格。

---

## 目录

1. [色彩系统](#1-色彩系统)
2. [字体系统](#2-字体系统)
3. [动效规范](#3-动效规范)
4. [组件样式模式](#4-组件样式模式)
5. [间距与圆角](#5-间距与圆角)
6. [响应式断点](#6-响应式断点)
7. [设计原则](#7-设计原则)

---

## 1. 色彩系统

### 主色调

| 颜色名称 | Tailwind 类名 | 色值 | 用途 |
|----------|---------------|------|------|
| 活力紫 (Primary) | `primary` | `#6C63FF` | 主按钮、选中态、关键行动点、渐变起点 |
| 霓虹青 (Secondary) | `secondary` | `#00F2FE` | 音准曲线、成功状态、进度条、高亮动作 |

### 背景色

| 颜色名称 | Tailwind 类名 | 色值 | 用途 |
|----------|---------------|------|------|
| 深空黑 (Background) | `background` | `#121212` | 主背景色（OLED 友好） |
| 卡片灰 (Surface) | `surface` | `#1E1E1E` | 卡片、列表项、弹窗背景 |

### 辅助色

| 颜色名称 | Tailwind 类名 | 色值 | 用途 |
|----------|---------------|------|------|
| 警示橙 (Warning) | `warning` | `#FF7A00` | 跑调指示、低分、需改进区域 |
| 提示红 (Error) | `error` | `#FF4D4D` | 错误反馈、删除操作 |

### 文字色

| 颜色名称 | Tailwind 类名 | 色值 | 用途 |
|----------|---------------|------|------|
| 柔白 (Text Primary) | `text-primary` | `#FFFFFF` | 主要文字 |
| 透明灰 (Text Secondary) | `text-secondary` | `#B0B0B0` | 辅助文字、时间戳、未选中态 |

### Tailwind 配置

```typescript
// tailwind.config.ts
colors: {
  primary: "#6C63FF",
  secondary: "#00F2FE",
  background: "#121212",
  surface: "#1E1E1E",
  warning: "#FF7A00",
  error: "#FF4D4D",
  "text-primary": "#FFFFFF",
  "text-secondary": "#B0B0B0",
}
```

---

## 2. 字体系统

### 字体配置

```typescript
// tailwind.config.ts
fontFamily: {
  poppins: ["var(--font-poppins)", "sans-serif"],
}
```

### 基础字体栈

```css
font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### 字号规范

| 用途 | Tailwind 类名 | 字号 |
|------|--------------|------|
| 超大标题 | `text-5xl` ~ `text-7xl` | 3rem ~ 4.5rem |
| 大标题 | `text-4xl` ~ `text-5xl` | 2.25rem ~ 3rem |
| 模块标题 | `text-3xl` ~ `text-4xl` | 1.875rem ~ 2.25rem |
| 正文大 | `text-xl` | 1.25rem |
| 正文 | `text-lg` | 1.125rem |
| 辅助文字 | `text-base` | 1rem |
| 小字 | `text-sm` | 0.875rem |
| 最小 | `text-xs` | 0.75rem |

---

## 3. 动效规范

### 自定义动画

```typescript
// tailwind.config.ts
animation: {
  "gradient-shift": "gradientShift 8s ease infinite",
  "float": "float 6s ease-in-out infinite",
  "pulse-glow": "pulseGlow 2s ease-in-out infinite",
}

keyframes: {
  gradientShift: {
    "0%, 100%": { backgroundPosition: "0% 50%" },
    "50%": { backgroundPosition: "100% 50%" },
  },
  float: {
    "0%, 100%": { transform: "translateY(0px)" },
    "50%": { transform: "translateY(-20px)" },
  },
  pulseGlow: {
    "0%, 100%": { opacity: "0.4" },
    "50%": { opacity: "1" },
  },
}
```

### Framer Motion 动画模式

```tsx
// 入场动画
<motion.div
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8 }}
>
  内容
</motion.div>

// 悬浮上浮
<motion.div whileHover={{ y: -8 }} transition={{ duration: 0.2 }}>
  内容
</motion.div>

// 延迟队列
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.5, delay: index * 0.1 }}
>
  内容
</motion.div>
```

---

## 4. 组件样式模式

### 4.1 按钮样式

#### 主要按钮（渐变 + 发光）

```tsx
<button className="bg-gradient-to-r from-primary to-primary/80 text-white font-medium rounded-full hover:opacity-90 transition-all hover:scale-105 glow-primary">
  按钮文字
</button>
```

#### 次要按钮（描边 + 毛玻璃）

```tsx
<button className="bg-surface/80 backdrop-blur-sm text-text-primary font-medium rounded-full border border-primary/30 hover:border-primary/60 transition-all">
  按钮文字
</button>
```

#### 图标按钮

```tsx
<button className="p-2 hover:bg-surface rounded-lg transition-colors">
  <Icon className="w-5 h-5" />
</button>
```

### 4.2 卡片样式

#### 毛玻璃卡片

```tsx
<div className="bg-surface/80 backdrop-blur-xl border border-primary/20 rounded-2xl p-6">
  内容
</div>
```

#### 悬浮上浮卡片

```tsx
<motion.div
  whileHover={{ y: -8, transition: { duration: 0.2 } }}
  className="bg-surface rounded-xl p-6"
>
  内容
</motion.div>
```

#### 渐变边框卡片

```tsx
<div className="relative bg-surface rounded-3xl p-4 border border-primary/20">
  <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-3xl blur-xl" />
  <div className="relative">内容</div>
</div>
```

### 4.3 发光效果

```css
/* 主要发光 */
.glow-primary {
  box-shadow: 0 0 30px rgba(108, 99, 255, 0.5);
}

/* 次要发光 */
.glow-secondary {
  box-shadow: 0 0 30px rgba(0, 242, 254, 0.5);
}
```

### 4.4 渐变文字

```tsx
<h1 className="text-gradient">渐变文字</h1>
```

```css
.text-gradient {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### 4.5 输入框

```tsx
<input
  type="text"
  placeholder="请输入..."
  className="w-full px-4 py-3 bg-surface rounded-xl text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
/>
```

### 4.6 标签/徽章

```tsx
<span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
  标签文字
</span>
```

### 4.7 分割线

```tsx
<div className="w-full h-px bg-surface/50" />
// 或
<div className="w-px h-12 bg-surface/50" />
```

---

## 5. 间距与圆角

### 页面容器

```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  内容
</div>
```

### 卡片内边距

| 尺寸 | 用途 |
|------|------|
| `p-4` | 紧凑布局 |
| `p-6` | 默认卡片 |
| `p-8` | 大卡片 |
| `p-10` | Hero 区域 |

### 圆角规范

| 尺寸 | Tailwind 类名 | 用途 |
|------|--------------|------|
| 小圆角 | `rounded-lg` | 输入框、标签 |
| 中圆角 | `rounded-xl` | 按钮、小卡片 |
| 大圆角 | `rounded-2xl` | 卡片、弹窗 |
| 超大圆角 | `rounded-3xl` | 手机 Mockup |
| 全圆 | `rounded-full` | 胶囊按钮、头像 |

### 间距系统

```tsx
// 元素间距
gap-2   // 8px
gap-4   // 16px
gap-6   // 24px
gap-8   // 32px

// 区域间距
py-8    // 上下 32px
py-12   // 上下 48px
py-16   // 上下 64px
py-20   // 上下 80px
```

---

## 6. 响应式断点

### Tailwind 默认断点

| 断点 | 宽度 | 用途 |
|------|------|------|
| `sm` | 640px | 手机横屏 |
| `md` | 768px | 平板 |
| `lg` | 1024px | 小桌面 |
| `xl` | 1280px | 大桌面 |

### 常用响应式模式

```tsx
// 隐藏/显示
className="hidden md:flex"           // 桌面显示，移动端隐藏
className="md:hidden"                // 移动端显示，桌面隐藏

// 文字大小
className="text-4xl sm:text-5xl lg:text-6xl"

// 网格布局
className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"

// 内边距
className="px-4 sm:px-6 lg:px-8"

// Flex 方向
className="flex flex-col md:flex-row"
```

---

## 7. 设计原则

### 7.1 动感即正义

所有反馈都应有丝滑动效，拒绝生硬数字。

```tsx
// 使用动画代替静态展示
<motion.div
  animate={{ scale: [1, 1.05, 1] }}
  transition={{ repeat: Infinity, duration: 2 }}
/>
```

### 7.2 无感降噪

使用 Tailwind 语义化类名，而非直接使用色值。

```tsx
// 推荐
className="text-text-secondary bg-surface"

// 避免
className="text-[#B0B0B0] bg-[#1E1E1E]"
```

### 7.3 沉浸式体验

使用毛玻璃效果和深色背景。

```tsx
<div className="bg-surface/80 backdrop-blur-xl">
  内容
</div>
```

### 7.4 即时反馈

使用颜色变化表示状态。

| 状态 | 颜色 |
|------|------|
| 准确 | `secondary` (#00F2FE) |
| 偏离 | `warning` (#FF7A00) |
| 错误 | `error` (#FF4D4D) |
| 成功 | `primary` (#6C63FF) |

---

## 附录：常用工具类速查

### 背景

```css
bg-background      /* #121212 */
bg-surface         /* #1E1E1E */
bg-primary         /* #6C63FF */
bg-secondary        /* #00F2FE */
bg-warning          /* #FF7A00 */
bg-error            /* #FF4D4D */
```

### 文字

```css
text-text-primary   /* #FFFFFF */
text-text-secondary /* #B0B0B0 */
text-primary        /* #6C63FF */
text-secondary      /* #00F2FE */
text-warning        /* #FF7A00 */
text-error          /* #FF4D4D */
```

### 边框

```css
border-primary/20   /* 20% 透明度 */
border-surface       /* #1E1E1E */
```

### 阴影

```css
shadow-primary/20    /* 紫色阴影 */
shadow-lg            /* 大阴影 */
```

### 模糊

```css
backdrop-blur-sm      /* 8px */
backdrop-blur-xl      /* 20px */
```

---

## 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 1.0.0 | 2026-05-17 | 初始版本 |

---

> 本文档由 UI Style Guide Generator 自动生成
> 项目地址: https://github.com/OpenWannaSing/web