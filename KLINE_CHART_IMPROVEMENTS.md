# K线图显示比例优化

## 问题描述
前端K线图在切换时间间隔时，所有数据都堆叠在一起，没有合适的显示比例。

## 解决方案

### 1. 自动显示范围调整
根据不同时间间隔自动设置合适的显示范围：

- **1分钟**: 显示最近2小时数据
- **15分钟**: 显示最近12小时数据  
- **30分钟**: 显示最近1天数据
- **1小时**: 显示最近3天数据
- **4小时**: 显示最近7天数据
- **1天**: 显示最近30天数据

### 2. 图表配置优化

#### 缩放和平移
```typescript
zoom: {
  enabled: true,
  type: 'x' as const,
  autoScaleYaxis: true
},
pan: {
  enabled: true,
  type: 'x' as const
}
```

#### X轴时间格式
根据时间间隔自动调整时间显示格式：
- 短时间间隔（1m, 15m, 30m）: `HH:mm`
- 中等时间间隔（1h, 4h）: `MM/dd HH:mm`
- 长时间间隔（1d）: `MM/dd`

#### Y轴自适应
```typescript
yaxis: {
  forceNiceScale: true,
  decimalsInFloat: 8
}
```

### 3. 用户交互改进

#### 自动重置缩放
- 切换时间间隔时自动重置到合适的显示范围
- 延迟100ms执行以确保图表已更新

#### 手动重置按钮
- 添加重置缩放按钮（旋转图标）
- 用户可以随时重置到默认显示范围

### 4. 动画效果
启用平滑动画效果：
```typescript
animations: {
  enabled: true,
  easing: 'easeinout',
  speed: 300
}
```

## 技术实现

### 核心函数
```typescript
const getDisplayRange = () => {
  if (candlestickData.length === 0) return {};
  
  const now = new Date().getTime();
  let rangeMs: number;
  
  switch (timeframe) {
    case '1m': rangeMs = 2 * 60 * 60 * 1000; break; // 2小时
    case '15m': rangeMs = 12 * 60 * 60 * 1000; break; // 12小时
    // ... 其他时间间隔
  }
  
  return {
    min: now - rangeMs,
    max: now
  };
};
```

### 重置缩放函数
```typescript
const resetChartZoom = () => {
  if (chartRef.current && candlestickData.length > 0) {
    try {
      const displayRange = getDisplayRange();
      if (displayRange.min && displayRange.max) {
        chartRef.current.chart.zoomX(displayRange.min, displayRange.max);
      }
    } catch (error) {
      console.log('Chart zoom reset failed:', error);
    }
  }
};
```

## 用户体验改进

### 1. 智能显示范围
- 不同时间间隔显示不同的数据范围
- 避免数据过于密集或稀疏

### 2. 平滑过渡
- 切换时间间隔时有平滑动画
- 避免突兀的跳转

### 3. 直观控制
- 重置按钮让用户可以快速回到默认视图
- 缩放和平移功能让用户可以自由探索数据

### 4. 响应式设计
- Y轴自动缩放以适应可见数据
- 时间格式根据间隔自动调整

## 测试建议

1. **切换时间间隔测试**
   - 在不同时间间隔之间切换
   - 观察显示范围是否合适
   - 检查动画是否平滑

2. **缩放功能测试**
   - 手动缩放图表
   - 点击重置按钮
   - 切换时间间隔后观察自动重置

3. **数据密度测试**
   - 在有大量数据的代币上测试
   - 在数据较少的代币上测试
   - 确保显示比例合适

4. **响应式测试**
   - 在不同屏幕尺寸下测试
   - 确保图表在移动设备上也能正常工作

## 预期效果

- ✅ 切换时间间隔时自动调整到合适的显示比例
- ✅ K线数据不再堆叠在一起
- ✅ 用户可以方便地缩放和平移图表
- ✅ 提供重置按钮快速回到默认视图
- ✅ 时间格式根据间隔自动优化
- ✅ 平滑的动画过渡效果
