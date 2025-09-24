import ProfilePageClient from "./ProfilePageClient";

// Generate static params for static export
export async function generateStaticParams() {
  // 对于静态导出，返回一个示例地址以满足构建要求
  // 实际的动态路由将在客户端处理
  return [
    { address: 'example' }
  ];
}

// 启用动态参数但不强制动态渲染
export const dynamicParams = true;

export default function UserProfilePage({ params }: { params: { address: string } }) {
  return <ProfilePageClient address={params.address} />;
}
