"use client";
import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

// 配置 NProgress
NProgress.configure({
  minimum: 0.3,
  easing: 'ease',
  speed: 500,
  showSpinner: true,
  trickleSpeed: 200,
  parent: 'body'
});

function NProgressComponent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 页面开始加载时启动进度条
    NProgress.start();
    
    // 模拟加载过程
    const timer = setTimeout(() => {
      NProgress.done();
    }, 100);

    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [pathname, searchParams]);

  return null;
}

export function NProgressProvider() {
  return (
    <Suspense fallback={null}>
      <NProgressComponent />
    </Suspense>
  );
}