import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 智能格式化价格显示
 * 根据价格大小自动选择合适的小数位数
 */
export function formatPrice(price: number | string): string {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;

  if (isNaN(numPrice) || numPrice === 0) return "0.000000";

  // 根据价格大小选择小数位数
  if (numPrice >= 1) return numPrice.toFixed(2);
  if (numPrice >= 0.01) return numPrice.toFixed(4);
  if (numPrice >= 0.0001) return numPrice.toFixed(6);
  if (numPrice >= 0.00001) return numPrice.toFixed(7);
  if (numPrice < 0.00001) {
    let normal = numPrice.toFixed(20);
    normal = normal.replace(/0+$/, "");
    const match = normal.match(/^0\.0+(?=[1-9])/);
    if (match) {
      const zeroCount = match[0].length - 3; 
      const rest = normal.slice(match[0].length).slice(0, 3);
      return `0.0{${zeroCount}}${rest}`;
    }
    return normal;
  }
}

/**
 * 格式化数字显示（用于市值、交易量等）
 */
export function formatNumber(num: number, decimals: number = 2): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
  return num.toFixed(decimals);
}
