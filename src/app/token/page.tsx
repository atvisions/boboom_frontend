"use client";
import { useSearchParams } from "next/navigation";
import TokenDetailPageClient from "./TokenDetailPageClient";


export default function TokenDetailPage() {
  const searchParams = useSearchParams();

  // 优先用 useSearchParams；在某些静态导出场景下兜底用 window.location.search
  const addressFromHook = searchParams.get("address");
  const addressFromWindow =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("address")
      : null;

  const address = addressFromHook || addressFromWindow || "";
  
  return <TokenDetailPageClient address={address} />;
}
