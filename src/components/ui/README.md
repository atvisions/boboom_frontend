# Toast Notification Component

这是一个通用的toast通知组件，基于sonner库实现，提供全站统一的提示功能。支持英文消息、不同颜色提示和防重复点击功能。

## 使用方法

### 1. 基本导入

```typescript
import { toast, toastMessages } from "@/components/ui/toast-notification";
```

### 2. 基本使用

```typescript
// 成功提示
toast.success("操作成功");

// 错误提示
toast.error("操作失败");

// 信息提示
toast.info("提示信息");

// 加载提示
const loadingToast = toast.loading("正在处理...");
// 完成后关闭
toast.dismiss(loadingToast);
```

### 3. 使用预设消息

```typescript
// 收藏相关
toast.success(toastMessages.favorites.added("Bitcoin"));
toast.success(toastMessages.favorites.removed("Ethereum"));

// 代币相关
toast.success(toastMessages.tokens.created);
toast.error(toastMessages.tokens.transactionError);

// 用户相关
toast.success(toastMessages.user.profileUpdated);
toast.success(toastMessages.user.followSuccess("username"));

// 通用
toast.success(toastMessages.common.copied);
toast.error(toastMessages.common.networkError);
```

### 4. 带配置的使用

```typescript
toast.success("操作成功", {
  description: "详细信息",
  duration: 5000,
  action: {
    label: "撤销",
    onClick: () => console.log("撤销操作"),
  },
});
```

## 预设消息类型

### favorites - 收藏相关
- `added(tokenName)` - 添加到收藏
- `removed(tokenName)` - 从收藏移除
- `error` - 收藏操作失败

### tokens - 代币相关
- `created` - 代币创建成功
- `createdError` - 代币创建失败
- `bought(tokenName)` - 购买成功
- `sold(tokenName)` - 出售成功
- `transactionError` - 交易失败

### user - 用户相关
- `profileUpdated` - 个人资料更新成功
- `profileUpdateError` - 个人资料更新失败
- `followSuccess(username)` - 关注成功
- `unfollowSuccess(username)` - 取消关注成功
- `followError` - 关注操作失败

### common - 通用
- `copied` - 复制成功
- `copyError` - 复制失败
- `networkError` - 网络错误
- `unknownError` - 未知错误

## 配置选项

```typescript
interface ToastConfig {
  title?: string;           // 标题
  description?: string;     // 描述
  duration?: number;        // 显示时长（毫秒）
  action?: {               // 操作按钮
    label: string;
    onClick: () => void;
  };
}
```

## 全局配置

toast的全局样式配置在 `src/app/providers.tsx` 中：

```typescript
<Toaster 
  position="top-right"
  toastOptions={{
    style: {
      background: '#151515',
      color: '#ffffff',
      border: '1px solid #232323',
    },
  }}
/>
```

## 颜色系统

不同类型的toast使用不同的纯色背景：

- **成功 (Success)** - 绿色背景 `#D7FE11` + 黑色文字 - 用于成功操作
- **错误 (Error)** - 红色背景 `#ef4444` + 白色文字 - 用于错误和失败
- **信息 (Info)** - 蓝色背景 `#3b82f6` + 白色文字 - 用于一般信息

## 防重复点击

使用 `useDebounce` hook 来防止用户重复点击：

```typescript
import { useDebounce } from "@/hooks/useDebounce";

const [isLoading, debouncedFunction] = useDebounce(
  (param) => {
    // 你的操作逻辑
  },
  1000 // 1秒防抖
);
```

## 最佳实践

1. **使用预设消息**：优先使用 `toastMessages` 中的预设消息，保持一致性
2. **适当的时长**：成功提示3秒，错误提示4秒，信息提示3秒
3. **提供操作**：对于重要操作，可以提供撤销按钮
4. **避免过多**：不要同时显示太多toast，避免干扰用户
5. **防重复点击**：重要操作按钮使用防抖功能
6. **加载状态**：显示按钮的加载状态，提供视觉反馈
