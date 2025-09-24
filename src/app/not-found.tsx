'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // 对于客户端路由，直接重定向到首页
    // 这样可以让React Router接管路由处理
    if (typeof window !== 'undefined') {
      // 检查当前路径是否是有效的应用路由
      const currentPath = window.location.pathname;
      
      // 如果是动态路由路径，让客户端路由器处理
      if (currentPath.startsWith('/token/') || 
          currentPath.startsWith('/profile/') || 
          currentPath === '/ranking' || 
          currentPath === '/rewards' || 
          currentPath === '/create') {
        // 不做任何操作，让客户端路由器处理
        return;
      }
      
      // 对于其他未知路径，重定向到首页
      router.push('/');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0E0E0E] text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-gray-400 mb-8">页面未找到</p>
        <button 
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-[#D7FE11] text-black rounded-lg hover:bg-[#D7FE11]/90 transition-colors"
        >
          返回首页
        </button>
      </div>
    </div>
  );
}
