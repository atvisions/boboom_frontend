import { toast as sonnerToast } from "sonner";

// Toast类型定义
export type ToastType = "success" | "error" | "info";

// Toast配置接口
export interface ToastConfig {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// 通用toast函数
export const toast = {
  // 成功提示 - 绿色背景
  success: (message: string, config?: ToastConfig) => {
    sonnerToast.success(message, {
      duration: config?.duration || 3000,
      description: config?.description,
      action: config?.action,
      style: {
        background: '#70E000',
        color: '#000000',
        border: 'none',
        fontWeight: '600',
      },
    });
  },

  // 错误提示 - 红色背景
  error: (message: string, config?: ToastConfig) => {
    sonnerToast.error(message, {
      duration: config?.duration || 4000,
      description: config?.description,
      action: config?.action,
      style: {
        background: '#ef4444',
        color: '#ffffff',
        border: 'none',
        fontWeight: '600',
      },
    });
  },

  // 信息提示 - 蓝色背景
  info: (message: string, config?: ToastConfig) => {
    sonnerToast.info(message, {
      duration: config?.duration || 3000,
      description: config?.description,
      action: config?.action,
      style: {
        background: '#3b82f6',
        color: '#ffffff',
        border: 'none',
        fontWeight: '600',
      },
    });
  },

  // 加载提示
  loading: (message: string) => {
    return sonnerToast.loading(message, {
      duration: Infinity,
    });
  },

  // 关闭指定toast
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },

  // 关闭所有toast
  dismissAll: () => {
    sonnerToast.dismiss();
  },
};

// 预设的toast消息
export const toastMessages = {
  // 收藏相关
  favorites: {
    added: (tokenName: string) => `${tokenName} added to favorites`,
    removed: (tokenName: string) => `${tokenName} removed from favorites`,
    error: "Failed to update favorites, please try again",
  },

  // 代币相关
  tokens: {
    created: "Token created successfully!",
    createdError: "Failed to create token, please try again",
    bought: (tokenName: string) => `Successfully bought ${tokenName}`,
    sold: (tokenName: string) => `Successfully sold ${tokenName}`,
    transactionError: "Transaction failed, please try again",
  },

  // 用户相关
  user: {
    profileUpdated: "Profile updated successfully",
    profileUpdateError: "Failed to update profile, please try again",
    followSuccess: (username: string) => `Now following ${username}`,
    unfollowSuccess: (username: string) => `Unfollowed ${username}`,
    followError: "Failed to update follow status, please try again",
  },

  // 通用
  common: {
    copied: "Copied to clipboard",
    copyError: "Failed to copy, please copy manually",
    networkError: "Network connection error, please check your connection",
    unknownError: "An unknown error occurred, please try again",
  },
};

// 使用示例：
// import { toast, toastMessages } from "@/components/ui/toast-notification";
// 
// // 基本使用
// toast.success("操作成功");
// toast.error("操作失败");
// 
// // 使用预设消息
// toast.success(toastMessages.favorites.added("Bitcoin"));
// toast.error(toastMessages.common.networkError);
// 
// // 带配置的使用
// toast.success("操作成功", {
//   description: "详细信息",
//   duration: 5000,
//   action: {
//     label: "撤销",
//     onClick: () => console.log("撤销操作"),
//   },
// });
