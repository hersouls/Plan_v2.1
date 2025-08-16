import { cn } from './utils';

// 반응형 브레이크포인트 정의
export const BREAKPOINTS = {
  xs: 320,   // 최소 모바일
  sm: 360,   // 갤럭시
  md: 375,   // 일반 모바일
  lg: 768,   // 태블릿
  xl: 1024,  // 데스크톱
  '2xl': 1440, // 대형 화면
  '3xl': 1920, // 초대형 화면
} as const;

// 반응형 텍스트 크기 매핑
export const RESPONSIVE_TEXT_SIZES = {
  title: {
    xs: 'text-lg',
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
    '2xl': 'text-5xl',
    '3xl': 'text-6xl',
  },
  subtitle: {
    xs: 'text-base',
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
    '2xl': 'text-4xl',
    '3xl': 'text-5xl',
  },
  body: {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-3xl',
    '3xl': 'text-4xl',
  },
  caption: {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
  },
} as const;

// 반응형 패딩 매핑
export const RESPONSIVE_PADDING = {
  container: {
    xs: 'px-2 py-4',
    sm: 'px-3 py-6',
    md: 'px-4 py-8',
    lg: 'px-6 py-10',
    xl: 'px-8 py-12',
    '2xl': 'px-10 py-16',
    '3xl': 'px-12 py-20',
  },
  card: {
    xs: 'p-3',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
    xl: 'p-8',
    '2xl': 'p-10',
    '3xl': 'p-12',
  },
  button: {
    xs: 'px-3 py-2',
    sm: 'px-4 py-2.5',
    md: 'px-5 py-3',
    lg: 'px-6 py-3.5',
    xl: 'px-8 py-4',
    '2xl': 'px-10 py-5',
    '3xl': 'px-12 py-6',
  },
} as const;

// 반응형 간격 매핑
export const RESPONSIVE_SPACING = {
  section: {
    xs: 'mb-4',
    sm: 'mb-6',
    md: 'mb-8',
    lg: 'mb-12',
    xl: 'mb-16',
    '2xl': 'mb-20',
    '3xl': 'mb-24',
  },
  element: {
    xs: 'space-y-2',
    sm: 'space-y-3',
    md: 'space-y-4',
    lg: 'space-y-5',
    xl: 'space-y-6',
    '2xl': 'space-y-8',
    '3xl': 'space-y-10',
  },
} as const;

// 반응형 그리드 매핑
export const RESPONSIVE_GRID = {
  stats: {
    xs: 'grid-cols-1',
    sm: 'grid-cols-2',
    md: 'grid-cols-2',
    lg: 'grid-cols-4',
    xl: 'grid-cols-4',
    '2xl': 'grid-cols-4',
    '3xl': 'grid-cols-4',
  },
  cards: {
    xs: 'grid-cols-1',
    sm: 'grid-cols-1',
    md: 'grid-cols-1',
    lg: 'grid-cols-2',
    xl: 'grid-cols-3',
    '2xl': 'grid-cols-3',
    '3xl': 'grid-cols-4',
  },
  buttons: {
    xs: 'flex-col',
    sm: 'flex-row',
    md: 'flex-row',
    lg: 'flex-row',
    xl: 'flex-row',
    '2xl': 'flex-row',
    '3xl': 'flex-row',
  },
} as const;

// 반응형 터치 타겟 크기
export const RESPONSIVE_TOUCH_TARGETS = {
  button: {
    xs: 'min-h-[44px] min-w-[44px]',
    sm: 'min-h-[44px] min-w-[44px]',
    md: 'min-h-[48px] min-w-[48px]',
    lg: 'min-h-[48px] min-w-[48px]',
    xl: 'min-h-[52px] min-w-[52px]',
    '2xl': 'min-h-[56px] min-w-[56px]',
    '3xl': 'min-h-[60px] min-w-[60px]',
  },
  icon: {
    xs: 'w-4 h-4',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
    '2xl': 'w-6 h-6',
    '3xl': 'w-7 h-7',
  },
} as const;

// 반응형 클래스 생성 함수
export function createResponsiveClasses(
  baseClasses: string,
  responsiveClasses: Record<string, string>
): string {
  const classes = [baseClasses];
  
  Object.entries(responsiveClasses).forEach(([breakpoint, className]) => {
    classes.push(`${breakpoint}:${className}`);
  });
  
  return cn(classes);
}

// 반응형 텍스트 크기 생성 함수
export function responsiveText(
  type: keyof typeof RESPONSIVE_TEXT_SIZES,
  customSizes?: Partial<Record<keyof typeof BREAKPOINTS, string>>
): string {
  const sizes = { ...RESPONSIVE_TEXT_SIZES[type], ...customSizes };
  return createResponsiveClasses('', sizes);
}

// 반응형 패딩 생성 함수
export function responsivePadding(
  type: keyof typeof RESPONSIVE_PADDING,
  customPadding?: Partial<Record<keyof typeof BREAKPOINTS, string>>
): string {
  const padding = { ...RESPONSIVE_PADDING[type], ...customPadding };
  return createResponsiveClasses('', padding);
}

// 반응형 간격 생성 함수
export function responsiveSpacing(
  type: keyof typeof RESPONSIVE_SPACING,
  customSpacing?: Partial<Record<keyof typeof BREAKPOINTS, string>>
): string {
  const spacing = { ...RESPONSIVE_SPACING[type], ...customSpacing };
  return createResponsiveClasses('', spacing);
}

// 반응형 그리드 생성 함수
export function responsiveGrid(
  type: keyof typeof RESPONSIVE_GRID,
  customGrid?: Partial<Record<keyof typeof BREAKPOINTS, string>>
): string {
  const grid = { ...RESPONSIVE_GRID[type], ...customGrid };
  return createResponsiveClasses('grid', grid);
}

// 반응형 터치 타겟 생성 함수
export function responsiveTouchTarget(
  type: keyof typeof RESPONSIVE_TOUCH_TARGETS,
  customTarget?: Partial<Record<keyof typeof BREAKPOINTS, string>>
): string {
  const target = { ...RESPONSIVE_TOUCH_TARGETS[type], ...customTarget };
  return createResponsiveClasses('', target);
}

// 화면 크기 감지 유틸리티
export function getCurrentBreakpoint(): keyof typeof BREAKPOINTS {
  if (typeof window === 'undefined') return 'md';
  
  const width = window.innerWidth;
  
  if (width >= BREAKPOINTS['3xl']) return '3xl';
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

// 모바일 여부 확인
export function isMobile(): boolean {
  const breakpoint = getCurrentBreakpoint();
  return breakpoint === 'xs' || breakpoint === 'sm' || breakpoint === 'md';
}

// 태블릿 여부 확인
export function isTablet(): boolean {
  const breakpoint = getCurrentBreakpoint();
  return breakpoint === 'lg';
}

// 데스크톱 여부 확인
export function isDesktop(): boolean {
  const breakpoint = getCurrentBreakpoint();
  return breakpoint === 'xl' || breakpoint === '2xl' || breakpoint === '3xl';
}

// 반응형 조건부 클래스 생성 함수
export function responsiveConditional(
  mobileClass: string,
  tabletClass?: string,
  desktopClass?: string
): string {
  const classes = [mobileClass];
  
  if (tabletClass) {
    classes.push(`lg:${tabletClass}`);
  }
  
  if (desktopClass) {
    classes.push(`xl:${desktopClass}`);
  }
  
  return cn(classes);
}

// 반응형 숨김/표시 유틸리티
export const responsiveVisibility = {
  hideOnMobile: 'hidden md:block',
  showOnMobile: 'block md:hidden',
  hideOnTablet: 'hidden lg:block',
  showOnTablet: 'block lg:hidden',
  hideOnDesktop: 'hidden xl:block',
  showOnDesktop: 'block xl:hidden',
} as const;

// 반응형 레이아웃 프리셋
export const responsiveLayouts = {
  hero: {
    container: responsivePadding('container'),
    title: responsiveText('title'),
    subtitle: responsiveText('subtitle'),
    spacing: responsiveSpacing('section'),
  },
  stats: {
    grid: responsiveGrid('stats'),
    card: responsivePadding('card'),
    spacing: responsiveSpacing('element'),
  },
  buttons: {
    container: responsiveConditional('flex-col', 'flex-row'),
    button: responsiveTouchTarget('button'),
    icon: responsiveTouchTarget('icon'),
    padding: responsivePadding('button'),
  },
  cards: {
    grid: responsiveGrid('cards'),
    card: responsivePadding('card'),
    spacing: responsiveSpacing('element'),
  },
} as const;
