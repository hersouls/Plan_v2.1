import { useState, useEffect } from 'react';
import { 
  getCurrentBreakpoint, 
  isMobile, 
  isTablet, 
  isDesktop,
  BREAKPOINTS 
} from '../lib/responsive';

interface ResponsiveState {
  breakpoint: keyof typeof BREAKPOINTS;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => ({
    breakpoint: getCurrentBreakpoint(),
    isMobile: isMobile(),
    isTablet: isTablet(),
    isDesktop: isDesktop(),
    width: typeof window !== 'undefined' ? window.innerWidth : 375,
    height: typeof window !== 'undefined' ? window.innerHeight : 667,
  }));

  useEffect(() => {
    function handleResize() {
      const breakpoint = getCurrentBreakpoint();
      setState({
        breakpoint,
        isMobile: isMobile(),
        isTablet: isTablet(),
        isDesktop: isDesktop(),
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // 초기 설정
    handleResize();

    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', handleResize);
    
    // 클린업
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return state;
}

// 특정 브레이크포인트 이상인지 확인하는 훅
export function useBreakpoint(breakpoint: keyof typeof BREAKPOINTS): boolean {
  const { width } = useResponsive();
  return width >= BREAKPOINTS[breakpoint];
}

// 모바일 전용 훅
export function useMobile(): boolean {
  return useResponsive().isMobile;
}

// 태블릿 전용 훅
export function useTablet(): boolean {
  return useResponsive().isTablet;
}

// 데스크톱 전용 훅
export function useDesktop(): boolean {
  return useResponsive().isDesktop;
}
