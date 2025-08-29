# 首页重构总结

## 概述
根据设计图对BoBoom Launchpad首页进行了全面重构，实现了现代化的侧边栏布局和深色主题设计。

## 主要变更

### 1. 布局结构
- **移除**: 原有的Header和Footer组件
- **新增**: 侧边栏布局，包含导航菜单和品牌标识
- **布局**: 左侧固定侧边栏 + 右侧主内容区域

### 2. 新增组件

#### `Sidebar.tsx`
- BOBOOM品牌标志（绿色A字母 + 文字）
- 导航菜单：Home、Profile、Ranking、Rewards、How it works
- 底部版权信息和社交媒体链接
- 当前页面高亮显示
- **固定高度**: 使用 `fixed` 定位，高度固定为屏幕高度
- **背景色**: 使用 `#151515` 纯色背景

#### `SearchHeader.tsx`
- **搜索框设计**:
  - 宽度: 410px
  - 高度: 40px
  - 背景色: #151515
  - 圆角: 15px
  - 字体: Hubot Sans Light
  - 无边框设计
  - 左侧搜索图标
- **Create Token按钮**:
  - 高度: 40px
  - 圆角: 15px
  - 边框: 2px 绿色边框
  - 字体: Hubot Sans Light
  - 悬停效果: 绿色背景，黑色文字
- **钱包连接按钮**: 保持原有RainbowKit组件，高度调整为40px
- **布局**: 搜索框在左侧，按钮组在最右侧，使用justify-between布局
- **最近交易卡片**: 4个彩色卡片显示交易历史

#### `TrendingSection.tsx` - 全新设计
- **固定尺寸**: 每个卡片固定为 350x343px
- **背景图**: 使用 `/Futuristic.png` 作为卡片背景
- **代币Logo**: 140x140px 圆形容器，半透明背景，毛玻璃效果
- **代币名称**: 24px 大小，粗体显示
- **市场数据**:
  - Market Cap（市值）
  - Volume（成交量）
  - Bonding Curve Progress（绑定曲线进度）
- **社交媒体图标**: Twitter、Telegram、Website，悬停时变绿色
- **响应式布局**: 
  - 小屏幕: 1列
  - 中等屏幕: 2列
  - 大屏幕: 3列
  - 超大屏幕: 4列
  - 2xl屏幕: 5列
- **设计特色**: 渐变遮罩、毛玻璃效果、现代化布局

#### `TokenGrid.tsx`
- 筛选控件：BSC下拉菜单、Animation开关
- 排序按钮：Top MC、Newest、Curved
- 9个代币卡片网格
- 每个卡片包含：图标、名称、描述、进度条、市值、交易量

### 3. 设计特色

#### 颜色方案
- **侧边栏背景**: #151515
- **主内容区域背景**: #0E0E0E
- **搜索框背景**: #151515
- **强调色**: 绿色 (#22c55e)
- **文字**: 白色和灰色层次

#### 字体系统
- **全局字体**: 所有文字统一使用Hubot Sans字体
- **字重管理**: 
  - Light (300): 搜索框、按钮文字
  - Regular (400): 正文内容
  - Medium (500): 导航菜单
  - Bold (700): 标题、重要信息
- **品牌一致性**: 提升整体品牌识别度

#### 侧边栏设计
- **固定定位**: 使用 `fixed` 定位，不随内容滚动
- **背景色**: 使用 `#151515` 纯色背景
- **高度**: 固定为屏幕高度 (`h-screen`)
- **层级**: 使用 `z-10` 确保在其他内容之上

#### 搜索栏设计
- **统一高度**: 所有元素高度为40px
- **圆角设计**: 15px圆角，现代化外观
- **无边框搜索**: 搜索框去掉边框，更简洁
- **2px边框按钮**: Create Token按钮使用2px绿色边框
- **布局优化**: 搜索框在左侧，按钮组在最右侧
- **搜索框宽度**: 410px，提供更好的搜索体验

#### Trending卡片设计
- **固定尺寸**: 350x343px，确保一致的视觉效果
- **背景图**: Futuristic.png 作为背景，使用 `sizes="350px"` 优化加载
- **代币Logo**: 140x140px 圆形容器，毛玻璃效果
- **代币名称**: 24px 粗体
- **数据展示**: Market Cap、Volume、Bonding Curve Progress
- **社交媒体**: Twitter、Telegram、Website 图标
- **响应式布局**: 根据屏幕宽度显示3-5个卡片
- **视觉效果**: 渐变遮罩、半透明元素、悬停动画

#### 主内容区域设计
- **统一背景色**: 搜索区域和内容区域都使用 `#0E0E0E`
- **无缝连接**: 搜索区域和内容区域背景色保持一致
- **响应式布局**: 使用 `ml-64` 为固定侧边栏留出空间

#### 交互效果
- 悬停效果（卡片、按钮）
- 进度条动画
- 平滑过渡效果
- 响应式设计

### 4. 技术实现

#### 使用的技术栈
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Lucide React (图标)
- RainbowKit (钱包连接)
- Hubot Sans (字体)

#### 字体配置
```typescript
const hubotSans = localFont({
  src: [
    {
      path: '../fonts/HubotSans-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/HubotSans-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/HubotSans-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-hubot-sans',
  display: 'swap',
});
```

#### 组件结构
```
src/
├── app/
│   ├── page.tsx (主页面)
│   └── layout.tsx (布局)
├── components/
│   └── home/
│       ├── Sidebar.tsx
│       ├── SearchHeader.tsx
│       ├── TrendingSection.tsx
│       └── TokenGrid.tsx
└── fonts/
    ├── HubotSans-Regular.woff2
    ├── HubotSans-Medium.woff2
    └── HubotSans-Bold.woff2
```

### 5. 功能特性

#### 响应式设计
- 移动端适配
- 平板端适配
- 桌面端优化

#### 交互功能
- 搜索功能（UI已实现）
- 钱包连接
- 代币筛选和排序
- 导航菜单

#### 数据展示
- 热门代币趋势
- 代币列表
- 交易历史
- 市场数据

## 文件变更

### 修改的文件
- `src/app/page.tsx` - 重构主页面，使用固定侧边栏布局，背景色#0E0E0E
- `src/app/layout.tsx` - 移除Header/Footer，设置Hubot Sans为全局字体
- `src/app/globals.css` - 添加Hubot Sans字体定义
- `tailwind.config.ts` - 添加Hubot Sans字体配置

### 新增的文件
- `src/components/home/Sidebar.tsx`
- `src/components/home/SearchHeader.tsx`
- `src/components/home/TrendingSection.tsx`
- `src/components/home/TokenGrid.tsx`
- `src/fonts/HubotSans-Regular.woff2`
- `src/fonts/HubotSans-Medium.woff2`
- `src/fonts/HubotSans-Bold.woff2`
- `public/Futuristic.png`

## 设计改进

### 侧边栏优化
1. **固定高度**: 侧边栏现在使用固定定位，高度不随内容变化
2. **背景色**: 使用 `#151515` 纯色背景，移除渐变效果
3. **字体升级**: 使用Hubot Sans字体，提升品牌识别度
4. **移除分割线**: 去掉了不必要的边框线，界面更简洁

### 搜索栏优化
1. **统一高度**: 所有元素高度调整为40px，与钱包按钮保持一致
2. **圆角设计**: 使用15px圆角，现代化外观
3. **无边框搜索**: 搜索框去掉边框，更简洁美观
4. **2px边框按钮**: Create Token按钮使用2px绿色边框，突出重要性
5. **布局优化**: 搜索框在左侧，按钮组在最右侧
6. **搜索框宽度**: 调整为410px，提供更好的搜索体验

### Trending卡片全新设计
1. **固定尺寸**: 350x343px，确保一致的视觉效果
2. **背景图**: 使用Futuristic.png作为背景，增加视觉冲击力
3. **代币Logo**: 140x140px圆形容器，毛玻璃效果，现代化设计
4. **代币名称**: 24px粗体，突出显示
5. **数据展示**: Market Cap、Volume、Bonding Curve Progress清晰展示
6. **社交媒体**: Twitter、Telegram、Website图标，悬停动画
7. **响应式布局**: 根据屏幕宽度显示3-5个卡片
8. **视觉效果**: 渐变遮罩、半透明元素、现代化布局

### 字体系统优化
1. **全局字体**: 所有组件统一使用Hubot Sans字体
2. **品牌一致性**: 提升整体品牌识别度和专业感
3. **字重管理**: 合理使用Light、Regular、Medium、Bold字重
4. **简化配置**: 移除各组件中的font-hubot-sans类，使用全局字体

### 主内容区域优化
1. **统一背景色**: 搜索区域和内容区域都使用 `#0E0E0E`
2. **无缝体验**: 搜索区域和内容区域背景色保持一致，视觉更统一
3. **响应式**: 保持响应式设计的同时确保侧边栏固定

### 颜色系统
- **侧边栏**: #151515（深灰色）
- **主内容区域**: #0E0E0E（更深的灰色）
- **搜索框**: #151515（与侧边栏一致）
- **强调色**: 绿色 (#22c55e)
- **文字**: 白色和灰色层次

## 下一步计划

1. **数据集成**: 连接真实的后端API
2. **功能完善**: 实现搜索、筛选、排序功能
3. **页面路由**: 完善其他页面（Profile、Ranking、Rewards等）
4. **性能优化**: 添加加载状态和错误处理
5. **测试**: 添加单元测试和集成测试
6. **移动端适配**: 优化移动端的侧边栏体验

## 访问方式

开发服务器运行在 `http://localhost:3000`，可以直接访问查看新的首页设计。
