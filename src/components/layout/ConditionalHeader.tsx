import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';

export function ConditionalHeader() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  // 숨겨야 하는 페이지 경로들
  const hiddenPaths = ['/login', '/signup', '/reset-password'];
  const shouldHideHeader = hiddenPaths.includes(location.pathname);

  useEffect(() => {
    // 라우트 변경 시 로딩 상태 관리
    setIsLoading(true);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 50); // 짧은 지연으로 자연스러운 전환

    return () => clearTimeout(timer);
  }, [location.pathname, shouldHideHeader]);

  // 로그인 관련 페이지에서는 완전히 숨김
  if (shouldHideHeader) {
    return null;
  }

  // 로딩 중일 때 스켈레톤 표시 (선택적)
  if (isLoading) {
    return (
      <div
        className="w-full h-16 bg-card border-b border-border animate-pulse"
        role="banner"
        aria-label="헤더 로딩 중"
      >
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="h-8 w-32 bg-muted rounded-lg animate-pulse"></div>
          <div className="flex space-x-4">
            <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
            <div className="h-8 w-20 bg-muted rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return <Header />;
}

export default ConditionalHeader;
