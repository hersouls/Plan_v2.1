// Moonwave Design Tokens System
// 디자인가이드 2.1 기반

export const DesignTokens = {
  // 🎨 Foundation Tokens (기초 토큰)
  foundation: {
    colors: {
      blue: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
      },
      gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      },
      green: {
        50: '#f0fdf4',
        500: '#22c55e',
        600: '#16a34a',
      },
      yellow: {
        50: '#fefce8',
        500: '#eab308',
        600: '#ca8a04',
      },
      red: {
        50: '#fef2f2',
        500: '#ef4444',
        600: '#dc2626',
      },
    },
    spacing: {
      '0': '0',
      '1': '0.25rem', // 4px
      '2': '0.5rem', // 8px
      '3': '0.75rem', // 12px
      '4': '1rem', // 16px
      '5': '1.25rem', // 20px
      '6': '1.5rem', // 24px
      '8': '2rem', // 32px
      '10': '2.5rem', // 40px
      '12': '3rem', // 48px
      '16': '4rem', // 64px
      '20': '5rem', // 80px
      '24': '6rem', // 96px
    },
    fontSize: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },
    borderRadius: {
      none: '0',
      sm: '0.125rem', // 2px
      md: '0.375rem', // 6px
      lg: '0.5rem', // 8px
      xl: '0.75rem', // 12px
      '2xl': '1rem', // 16px
    },
    shadow: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    },
  },

  // 🎯 Semantic Tokens (의미 토큰)
  semantic: {
    colors: {
      primary: {
        50: 'var(--foundation-blue-50)',
        500: 'var(--foundation-blue-500)',
        600: 'var(--foundation-blue-600)',
        700: 'var(--foundation-blue-700)',
      },
      success: {
        50: 'var(--foundation-green-50)',
        500: 'var(--foundation-green-500)',
        600: 'var(--foundation-green-600)',
      },
      warning: {
        50: 'var(--foundation-yellow-50)',
        500: 'var(--foundation-yellow-500)',
        600: 'var(--foundation-yellow-600)',
      },
      danger: {
        50: 'var(--foundation-red-50)',
        500: 'var(--foundation-red-500)',
        600: 'var(--foundation-red-600)',
      },
      text: {
        primary: 'var(--foundation-gray-900)',
        secondary: 'var(--foundation-gray-700)',
        tertiary: 'var(--foundation-gray-500)',
        inverse: '#ffffff',
      },
      background: {
        primary: '#ffffff',
        secondary: 'var(--foundation-gray-50)',
        tertiary: 'var(--foundation-gray-100)',
      },
      border: {
        primary: 'var(--foundation-gray-200)',
        secondary: 'var(--foundation-gray-300)',
        focus: 'var(--foundation-blue-500)',
      },
    },
    spacing: {
      xs: 'var(--foundation-spacing-2)', // 8px
      sm: 'var(--foundation-spacing-4)', // 16px
      md: 'var(--foundation-spacing-6)', // 24px
      lg: 'var(--foundation-spacing-8)', // 32px
      xl: 'var(--foundation-spacing-12)', // 48px
    },
    typography: {
      title: {
        fontSize: 'var(--foundation-fontSize-4xl)',
        fontWeight: '700',
        lineHeight: '1.2',
        letterSpacing: '-0.02em',
      },
      heading: {
        fontSize: 'var(--foundation-fontSize-2xl)',
        fontWeight: '600',
        lineHeight: '1.3',
        letterSpacing: '-0.01em',
      },
      body: {
        fontSize: 'var(--foundation-fontSize-base)',
        fontWeight: '400',
        lineHeight: '1.6',
        letterSpacing: '-0.01em',
      },
      caption: {
        fontSize: 'var(--foundation-fontSize-sm)',
        fontWeight: '400',
        lineHeight: '1.4',
        letterSpacing: '0em',
      },
    },
  },

  // 🧩 Component Tokens (컴포넌트 토큰)
  components: {
    button: {
      primary: {
        backgroundColor: 'var(--semantic-primary-600)',
        color: 'var(--semantic-text-inverse)',
        borderRadius: 'var(--foundation-borderRadius-lg)',
        paddingX: 'var(--semantic-spacing-sm)',
        paddingY: 'var(--semantic-spacing-xs)',
        fontSize: 'var(--foundation-fontSize-base)',
        fontWeight: '600',
        boxShadow: 'var(--foundation-shadow-sm)',
        _hover: {
          backgroundColor: 'var(--semantic-primary-700)',
          boxShadow: 'var(--foundation-shadow-md)',
        },
      },
      secondary: {
        backgroundColor: 'var(--semantic-background-primary)',
        color: 'var(--semantic-text-primary)',
        borderColor: 'var(--semantic-border-primary)',
        borderWidth: '1px',
        borderRadius: 'var(--foundation-borderRadius-lg)',
        paddingX: 'var(--semantic-spacing-sm)',
        paddingY: 'var(--semantic-spacing-xs)',
        _hover: {
          backgroundColor: 'var(--semantic-background-secondary)',
        },
      },
    },
    card: {
      default: {
        backgroundColor: 'var(--semantic-background-primary)',
        borderColor: 'var(--semantic-border-primary)',
        borderWidth: '1px',
        borderRadius: 'var(--foundation-borderRadius-xl)',
        padding: 'var(--semantic-spacing-md)',
        boxShadow: 'var(--foundation-shadow-sm)',
        _hover: {
          boxShadow: 'var(--foundation-shadow-md)',
        },
      },
    },
    input: {
      default: {
        backgroundColor: 'var(--semantic-background-primary)',
        borderColor: 'var(--semantic-border-primary)',
        borderWidth: '1px',
        borderRadius: 'var(--foundation-borderRadius-md)',
        paddingX: 'var(--semantic-spacing-xs)',
        paddingY: 'var(--semantic-spacing-xs)',
        fontSize: 'var(--foundation-fontSize-base)',
        _focus: {
          borderColor: 'var(--semantic-border-focus)',
          boxShadow: '0 0 0 2px rgb(59 130 246 / 0.2)',
        },
      },
    },
  },
};

// 🎨 Color Tokens
export const ColorTokens = {
  // 브랜드 컬러
  brand: {
    primary: 'var(--foundation-blue-600)',
    secondary: 'var(--foundation-blue-500)',
    accent: 'var(--foundation-blue-400)',
  },

  // 텍스트 컬러
  text: {
    primary: 'var(--foundation-gray-900)',
    secondary: 'var(--foundation-gray-700)',
    tertiary: 'var(--foundation-gray-500)',
    inverse: '#ffffff',
    success: 'var(--foundation-green-600)',
    warning: 'var(--foundation-yellow-600)',
    error: 'var(--foundation-red-600)',
    link: 'var(--foundation-blue-600)',
    linkHover: 'var(--foundation-blue-700)',
  },

  // 상태 컬러
  state: {
    success: 'var(--foundation-green-600)',
    successBg: 'var(--foundation-green-50)',
    warning: 'var(--foundation-yellow-600)',
    warningBg: 'var(--foundation-yellow-50)',
    error: 'var(--foundation-red-600)',
    errorBg: 'var(--foundation-red-50)',
    info: 'var(--foundation-blue-600)',
    infoBg: 'var(--foundation-blue-50)',
  },

  // 배경 컬러
  background: {
    primary: 'var(--semantic-background-primary)',
    secondary: 'var(--semantic-background-secondary)',
    tertiary: 'var(--foundation-gray-100)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    card: 'var(--component-card-bg)',
  },

  // 경계선 컬러
  border: {
    default: 'var(--semantic-border-primary)',
    secondary: 'var(--foundation-gray-300)',
    focus: 'var(--semantic-border-focus)',
    success: 'var(--foundation-green-200)',
    warning: 'var(--foundation-yellow-200)',
    error: 'var(--foundation-red-200)',
  },
};

// 📏 Spacing Tokens
export const SpacingTokens = {
  // 기본 스페이싱 (4px 단위)
  base: {
    0: '0',
    1: '0.25rem', // 4px
    2: '0.5rem', // 8px
    3: '0.75rem', // 12px
    4: '1rem', // 16px
    5: '1.25rem', // 20px
    6: '1.5rem', // 24px
    8: '2rem', // 32px
    10: '2.5rem', // 40px
    12: '3rem', // 48px
    16: '4rem', // 64px
    20: '5rem', // 80px
    24: '6rem', // 96px
  },

  // 의미론적 스페이싱
  semantic: {
    none: 'var(--spacing-0)',
    xs: 'var(--spacing-2)', // 8px
    sm: 'var(--spacing-4)', // 16px
    md: 'var(--spacing-6)', // 24px
    lg: 'var(--spacing-8)', // 32px
    xl: 'var(--spacing-12)', // 48px
    '2xl': 'var(--spacing-16)', // 64px
    '3xl': 'var(--spacing-20)', // 80px
  },

  // 컴포넌트별 스페이싱
  component: {
    button: {
      paddingX: 'var(--spacing-semantic-sm)',
      paddingY: 'var(--spacing-semantic-xs)',
      gap: 'var(--spacing-semantic-xs)',
    },
    card: {
      padding: 'var(--spacing-semantic-md)',
      gap: 'var(--spacing-semantic-sm)',
    },
    input: {
      paddingX: 'var(--spacing-semantic-xs)',
      paddingY: 'var(--spacing-semantic-xs)',
    },
    layout: {
      sectionGap: 'var(--spacing-semantic-xl)',
      componentGap: 'var(--spacing-semantic-md)',
      elementGap: 'var(--spacing-semantic-sm)',
    },
  },
};

// 🎭 Glass Effect Tokens
export const GlassTokens = {
  variants: {
    light: {
      background: 'rgba(255, 255, 255, 0.25)',
      backdropBlur: 'blur(4px)',
      border: 'rgba(255, 255, 255, 0.18)',
      shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    },
    medium: {
      background: 'rgba(255, 255, 255, 0.35)',
      backdropBlur: 'blur(8px)',
      border: 'rgba(255, 255, 255, 0.25)',
      shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    },
    dark: {
      background: 'rgba(255, 255, 255, 0.45)',
      backdropBlur: 'blur(12px)',
      border: 'rgba(255, 255, 255, 0.30)',
      shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    },
    colored: {
      primary: {
        background: 'rgba(59, 130, 246, 0.25)',
        backdropBlur: 'blur(8px)',
        border: 'rgba(59, 130, 246, 0.30)',
        shadow: '0 8px 32px 0 rgba(59, 130, 246, 0.3)',
      },
      success: {
        background: 'rgba(34, 197, 94, 0.25)',
        backdropBlur: 'blur(8px)',
        border: 'rgba(34, 197, 94, 0.30)',
        shadow: '0 8px 32px 0 rgba(34, 197, 94, 0.3)',
      },
    },
  },

  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
  },

  animation: {
    hover: {
      transform: 'translateY(-2px)',
      shadow: '0 12px 40px 0 rgba(31, 38, 135, 0.5)',
    },
  },
};

// 🌊 Wave Effect Tokens
export const WaveTokens = {
  patterns: {
    gentle:
      'M0,192L48,181.3C96,171,192,149,288,154.7C384,160,480,192,576,213.3C672,235,768,245,864,218.7C960,192,1056,128,1152,106.7C1248,85,1344,107,1392,117.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z',
    dynamic:
      'M0,160L60,170.7C120,181,240,203,360,197.3C480,192,600,160,720,149.3C840,139,960,149,1080,165.3C1200,181,1320,203,1380,213.3L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z',
    dramatic:
      'M0,96L60,122.7C120,149,240,203,360,208C480,213,600,171,720,165.3C840,160,960,192,1080,197.3C1200,203,1320,181,1380,170.7L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z',
  },

  colors: {
    primary: 'var(--semantic-primary-500)',
    secondary: 'var(--foundation-gray-200)',
    accent: 'var(--foundation-blue-300)',
    white: '#ffffff',
  },

  heights: {
    sm: 60,
    md: 100,
    lg: 150,
    xl: 200,
  },

  opacity: {
    subtle: 0.3,
    medium: 0.6,
    strong: 0.9,
  },
};

// 🎨 Gradient Tokens
export const GradientTokens = {
  moonwave: {
    colors: ['#667eea', '#764ba2'],
    cssClass: 'from-[#667eea] to-[#764ba2]',
  },
  sunset: {
    colors: ['#f093fb', '#f5576c'],
    cssClass: 'from-[#f093fb] to-[#f5576c]',
  },
  ocean: {
    colors: ['#4facfe', '#00f2fe'],
    cssClass: 'from-[#4facfe] to-[#00f2fe]',
  },
  forest: {
    colors: ['#43e97b', '#38f9d7'],
    cssClass: 'from-[#43e97b] to-[#38f9d7]',
  },
  purple: {
    colors: ['#fa709a', '#fee140'],
    cssClass: 'from-[#fa709a] to-[#fee140]',
  },
  brand: {
    colors: ['var(--semantic-primary-500)', 'var(--semantic-primary-700)'],
    cssClass: 'from-blue-500 to-blue-700',
  },
};

export const GradientDirectionTokens = {
  vertical: 'bg-gradient-to-b',
  horizontal: 'bg-gradient-to-r',
  diagonal: 'bg-gradient-to-br',
  radial: 'bg-gradient-radial',
};

// 🎯 Quick Reference Tokens
export const QuickTokens = {
  // 색상
  primaryBlue: 'var(--semantic-primary-600)',
  textPrimary: 'var(--semantic-text-primary)',
  backgroundCard: 'var(--component-card-bg)',
  borderDefault: 'var(--semantic-border-primary)',

  // 간격
  spacingXs: 'var(--spacing-semantic-xs)', // 8px
  spacingSm: 'var(--spacing-semantic-sm)', // 16px
  spacingMd: 'var(--spacing-semantic-md)', // 24px
  spacingLg: 'var(--spacing-semantic-lg)', // 32px

  // 타이포그래피
  fontSizeBase: 'var(--typography-fontSize-base)',
  fontWeightMedium: 'var(--typography-fontWeight-medium)',

  // 둥근 모서리
  borderRadiusMd: 'var(--foundation-borderRadius-md)',
  borderRadiusLg: 'var(--foundation-borderRadius-lg)',

  // 그림자
  shadowSm: 'var(--foundation-shadow-sm)',
  shadowMd: 'var(--foundation-shadow-md)',
};

// 🎨 Background Pattern Tokens
export const BackgroundPatternTokens = {
  dots: {
    small:
      'radial-gradient(circle, var(--foundation-gray-300) 1px, transparent 1px)',
    medium:
      'radial-gradient(circle, var(--foundation-gray-300) 2px, transparent 2px)',
    large:
      'radial-gradient(circle, var(--foundation-gray-300) 3px, transparent 3px)',
  },

  grid: {
    fine: `linear-gradient(var(--foundation-gray-200) 1px, transparent 1px),
           linear-gradient(90deg, var(--foundation-gray-200) 1px, transparent 1px)`,
    medium: `linear-gradient(var(--foundation-gray-300) 1px, transparent 1px),
             linear-gradient(90deg, var(--foundation-gray-300) 1px, transparent 1px)`,
    bold: `linear-gradient(var(--foundation-gray-400) 2px, transparent 2px),
           linear-gradient(90deg, var(--foundation-gray-400) 2px, transparent 2px)`,
  },

  sizes: {
    dots: {
      small: '16px 16px',
      medium: '24px 24px',
      large: '32px 32px',
    },
    grid: {
      fine: '20px 20px',
      medium: '40px 40px',
      bold: '60px 60px',
    },
  },
};

// 📝 Typography Tokens
export const TypographyTokens = {
  fontFamily: {
    primary: ['Pretendard Variable', 'Pretendard', 'system-ui', 'sans-serif'],
    mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'monospace'],
  },

  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  fontSize: {
    xs: { size: '0.75rem', lineHeight: '1rem' }, // 12px/16px
    sm: { size: '0.875rem', lineHeight: '1.25rem' }, // 14px/20px
    base: { size: '1rem', lineHeight: '1.5rem' }, // 16px/24px
    lg: { size: '1.125rem', lineHeight: '1.75rem' }, // 18px/28px
    xl: { size: '1.25rem', lineHeight: '1.75rem' }, // 20px/28px
    '2xl': { size: '1.5rem', lineHeight: '2rem' }, // 24px/32px
    '3xl': { size: '1.875rem', lineHeight: '2.25rem' }, // 30px/36px
    '4xl': { size: '2.25rem', lineHeight: '2.5rem' }, // 36px/40px
  },

  letterSpacing: {
    tight: '-0.02em',
    normal: '-0.01em',
    wide: '0.01em',
  },
};

// 🎯 Filter Options Tokens (필터 옵션 전역 설정)
export const FilterOptionsTokens = {
  // 시간 기준 필터 옵션
  timeFilters: {
    today: {
      key: 'today',
      label: '오늘',
      icon: 'Calendar',
      ariaLabel: '오늘 할일 보기',
      description: '오늘 날짜의 할일만 표시',
    },
    week: {
      key: 'week',
      label: '이번주',
      icon: 'CalendarRange',
      ariaLabel: '이번주 할일 보기',
      description: '이번 주의 할일만 표시',
    },
    all: {
      key: 'all',
      label: '전체',
      icon: 'List',
      ariaLabel: '전체 할일 보기',
      description: '모든 할일 표시',
    },
  },

  // 할일 가시성 필터 옵션
  visibilityFilters: {
    personal: {
      key: 'personal',
      label: '개인',
      icon: 'User',
      ariaLabel: '개인 할일 보기',
      description: '나만 보는 개인 할일만 표시',
    },
    group: {
      key: 'group',
      label: '그룹',
      icon: 'Users',
      ariaLabel: '그룹 할일 보기',
      description: '그룹 할일만 표시',
    },
    all: {
      key: 'all',
      label: '전체',
      icon: 'List',
      ariaLabel: '모든 할일 통합 보기',
      description: '개인과 그룹 할일 모두 표시',
    },
  },

  // 우선순위 필터 옵션
  priorityFilters: {
    high: {
      key: 'high',
      label: '높음',
      color: 'red',
      icon: 'Flag',
      ariaLabel: '높은 우선순위 할일 보기',
    },
    medium: {
      key: 'medium',
      label: '보통',
      color: 'yellow',
      icon: 'Flag',
      ariaLabel: '보통 우선순위 할일 보기',
    },
    low: {
      key: 'low',
      label: '낮음',
      color: 'blue',
      icon: 'Flag',
      ariaLabel: '낮은 우선순위 할일 보기',
    },
  },

  // 상태 필터 옵션
  statusFilters: {
    pending: {
      key: 'pending',
      label: '대기중',
      color: 'gray',
      icon: 'Clock',
      ariaLabel: '대기중인 할일 보기',
    },
    inProgress: {
      key: 'in_progress',
      label: '진행중',
      color: 'blue',
      icon: 'Play',
      ariaLabel: '진행중인 할일 보기',
    },
    completed: {
      key: 'completed',
      label: '완료',
      color: 'green',
      icon: 'Check',
      ariaLabel: '완료된 할일 보기',
    },
  },

  // 날짜 범위 필터 옵션 (통계용)
  dateRangeFilters: {
    '7days': {
      key: '7days',
      label: '7일',
      icon: 'Calendar',
      ariaLabel: '최근 7일 통계 보기',
      description: '최근 7일간의 데이터 표시',
      days: 7,
    },
    '30days': {
      key: '30days',
      label: '30일',
      icon: 'CalendarRange',
      ariaLabel: '최근 30일 통계 보기',
      description: '최근 30일간의 데이터 표시',
      days: 30,
    },
    '3months': {
      key: '3months',
      label: '3개월',
      icon: 'Calendar',
      ariaLabel: '최근 3개월 통계 보기',
      description: '최근 3개월간의 데이터 표시',
      days: 90,
    },
    year: {
      key: 'year',
      label: '1년',
      icon: 'Calendar',
      ariaLabel: '최근 1년 통계 보기',
      description: '최근 1년간의 데이터 표시',
      days: 365,
    },
  },
} as const;

// 🎯 Filter Configuration (필터 설정)
export const FilterConfig = {
  // 기본 필터 설정
  defaults: {
    timeFilter: 'today',
    visibilityFilter: 'personal',
    priorityFilter: null,
    statusFilter: null,
  },

  // 필터 조합 규칙
  combinations: {
    // 시간 필터와 가시성 필터는 항상 함께 사용
    timeAndVisibility: ['timeFilter', 'visibilityFilter'],

    // 우선순위와 상태 필터는 선택적
    optional: ['priorityFilter', 'statusFilter'],
  },

  // 필터 표시 순서
  displayOrder: {
    timeFilters: ['today', 'week', 'all'] as const,
    visibilityFilters: ['personal', 'group', 'all'] as const,
    priorityFilters: ['high', 'medium', 'low'] as const,
    statusFilters: ['pending', 'inProgress', 'completed'] as const,
    dateRangeFilters: ['7days', '30days', '3months', 'year'] as const,
  },
} as const;

// 🛠️ Filter Utility Functions (필터 유틸리티 함수들)
export const FilterUtils = {
  // 시간 필터 옵션 가져오기
  getTimeFilterOptions: () => {
    return FilterConfig.displayOrder.timeFilters.map(
      key =>
        FilterOptionsTokens.timeFilters[
          key as keyof typeof FilterOptionsTokens.timeFilters
        ]
    );
  },

  // 가시성 필터 옵션 가져오기
  getVisibilityFilterOptions: () => {
    return FilterConfig.displayOrder.visibilityFilters.map(
      key =>
        FilterOptionsTokens.visibilityFilters[
          key as keyof typeof FilterOptionsTokens.visibilityFilters
        ]
    );
  },

  // 우선순위 필터 옵션 가져오기
  getPriorityFilterOptions: () => {
    return FilterConfig.displayOrder.priorityFilters.map(
      key =>
        FilterOptionsTokens.priorityFilters[
          key as keyof typeof FilterOptionsTokens.priorityFilters
        ]
    );
  },

  // 상태 필터 옵션 가져오기
  getStatusFilterOptions: () => {
    return FilterConfig.displayOrder.statusFilters.map(
      key =>
        FilterOptionsTokens.statusFilters[
          key as keyof typeof FilterOptionsTokens.statusFilters
        ]
    );
  },

  // 날짜 범위 필터 옵션 가져오기
  getDateRangeFilterOptions: () => {
    return FilterConfig.displayOrder.dateRangeFilters.map(
      key =>
        FilterOptionsTokens.dateRangeFilters[
          key as keyof typeof FilterOptionsTokens.dateRangeFilters
        ]
    );
  },

  // 특정 필터 옵션 가져오기
  getFilterOption: (
    type: 'time' | 'visibility' | 'priority' | 'status' | 'dateRange',
    key: string
  ) => {
    switch (type) {
      case 'time':
        return FilterOptionsTokens.timeFilters[
          key as keyof typeof FilterOptionsTokens.timeFilters
        ];
      case 'visibility':
        return FilterOptionsTokens.visibilityFilters[
          key as keyof typeof FilterOptionsTokens.visibilityFilters
        ];
      case 'priority':
        return FilterOptionsTokens.priorityFilters[
          key as keyof typeof FilterOptionsTokens.priorityFilters
        ];
      case 'status':
        return FilterOptionsTokens.statusFilters[
          key as keyof typeof FilterOptionsTokens.statusFilters
        ];
      case 'dateRange':
        return FilterOptionsTokens.dateRangeFilters[
          key as keyof typeof FilterOptionsTokens.dateRangeFilters
        ];
      default:
        return undefined;
    }
  },

  // 필터 라벨 가져오기
  getFilterLabel: (
    type: 'time' | 'visibility' | 'priority' | 'status' | 'dateRange',
    key: string
  ) => {
    const option = FilterUtils.getFilterOption(type, key);
    return option?.label || key;
  },

  // 필터 아이콘 가져오기
  getFilterIcon: (
    type: 'time' | 'visibility' | 'priority' | 'status' | 'dateRange',
    key: string
  ) => {
    const option = FilterUtils.getFilterOption(type, key);
    return option?.icon || 'Circle';
  },

  // 필터 aria-label 가져오기
  getFilterAriaLabel: (
    type: 'time' | 'visibility' | 'priority' | 'status' | 'dateRange',
    key: string,
    isSelected: boolean = false
  ) => {
    const option = FilterUtils.getFilterOption(type, key);
    const baseLabel = option?.ariaLabel || `${key} 보기`;
    return isSelected ? `${baseLabel} (선택됨)` : baseLabel;
  },

  // 필터 설명 가져오기
  getFilterDescription: (
    type: 'time' | 'visibility' | 'priority' | 'status' | 'dateRange',
    key: string
  ) => {
    const option = FilterUtils.getFilterOption(type, key);
    return (option as any)?.description || '';
  },

  // 필터 색상 가져오기 (우선순위, 상태용)
  getFilterColor: (type: 'priority' | 'status', key: string) => {
    const option = FilterUtils.getFilterOption(type, key);
    return (option as any)?.color || 'gray';
  },
};
