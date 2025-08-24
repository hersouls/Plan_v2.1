/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Design Token: Typography
      fontFamily: {
        'pretendard': ['Pretendard Variable', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'sans-serif'],
        'sans': ['Pretendard Variable', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'sans-serif'],
      },
      // Design Token: Typography - Foundation Tokens
      fontSize: {
        // Foundation typography - matching design guide
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0' }],    // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0' }], // 14px  
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em' }], // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }], // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],  // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.01em' }],     // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],   // 36px
        
        // Korean optimized variants
        'xs-ko': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0' }],
        'sm-ko': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0' }],
        'base-ko': ['1rem', { lineHeight: '1.6rem', letterSpacing: '-0.01em' }],
        'lg-ko': ['1.125rem', { lineHeight: '1.8rem', letterSpacing: '-0.01em' }],
        'xl-ko': ['1.25rem', { lineHeight: '1.8rem', letterSpacing: '-0.01em' }],
        '2xl-ko': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.01em' }],
        '3xl-ko': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl-ko': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
      },
      letterSpacing: {
        'ko-tight': '-0.02em',
        'ko-normal': '-0.01em',
        'ko-wide': '0',
      },
      // Design Token: Colors - Foundation & Semantic Tokens
      colors: {
        // Foundation Colors - Direct mapping from design guide
        foundation: {
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
            900: '#1e3a8a'
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
            900: '#111827'
          },
          green: {
            50: '#f0fdf4',
            500: '#22c55e',
            600: '#16a34a'
          },
          yellow: {
            50: '#fefce8',
            500: '#eab308',
            600: '#ca8a04'
          },
          red: {
            50: '#fef2f2',
            500: '#ef4444',
            600: '#dc2626'
          }
        },

        // Semantic Colors - Use CSS variables properly
        semantic: {
          primary: {
            50: 'var(--foundation-blue-50)',
            500: 'var(--foundation-blue-500)',
            600: 'var(--foundation-blue-600)',
            700: 'var(--foundation-blue-700)'
          },
          success: {
            50: 'var(--foundation-green-50)',
            500: 'var(--foundation-green-500)',
            600: 'var(--foundation-green-600)'
          },
          warning: {
            50: 'var(--foundation-yellow-50)',
            500: 'var(--foundation-yellow-500)',
            600: 'var(--foundation-yellow-600)'
          },
          danger: {
            50: 'var(--foundation-red-50)',
            500: 'var(--foundation-red-500)',
            600: 'var(--foundation-red-600)'
          }
        },

        // Moonwave Plan brand colors - using CSS variables  
        primary: {
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

        // Task management specific colors
        plan: {
          pending: '#f59e0b',    // 대기중 - amber
          progress: '#3b82f6',   // 진행중 - blue  
          completed: '#22c55e',  // 완료 - green
          high: '#ef4444',       // 높은 우선순위 - red
          medium: '#f59e0b',     // 중간 우선순위 - amber
          low: '#6b7280',        // 낮은 우선순위 - gray
        },

        // Family category colors
        category: {
          home: '#f59e0b',       // 집안일 - amber
          work: '#8b5cf6',       // 업무 - violet
          personal: '#ec4899',   // 개인 - pink
          shopping: '#10b981',   // 쇼핑 - emerald
          etc: '#6b7280'         // 기타 - gray
        },

        // Glass morphism
        glass: {
          light: 'rgba(255, 255, 255, 0.1)',
          medium: 'rgba(255, 255, 255, 0.2)',
          strong: 'rgba(255, 255, 255, 0.3)',
        },

        // Legacy support  
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

        // Add colors for direct CSS variable usage
        'primary-light': 'var(--semantic-primary-50)',
        'primary-foreground': 'var(--semantic-text-inverse)',
        'success-light': 'var(--semantic-success-50)',
        'warning-light': 'var(--semantic-warning-50)',
        'danger-light': 'var(--semantic-danger-50)',
        'error-light': 'var(--semantic-danger-50)',
        'info-light': 'var(--semantic-primary-50)',
        'secondary-light': 'var(--semantic-background-secondary)',
        
        // Background tokens (다크모드로 통일)
        'background': 'var(--semantic-background-primary)',
        'foreground': '#ffffff',                    /* 다크모드로 통일 - 흰색 */
        'muted': 'var(--semantic-background-tertiary)',
        'muted-foreground': '#e2e8f0',              /* 다크모드로 통일 - 밝은 회색 */
        'card': 'var(--semantic-background-primary)',
        'card-foreground': '#ffffff',               /* 다크모드로 통일 - 흰색 */
        'border': 'var(--semantic-border-primary)',
        'input': 'var(--semantic-background-primary)',
        'ring': 'var(--semantic-primary-500)',
        
        // Dark mode specific tokens for better contrast (더 밝은 색상으로 개선)
        'dark-background': 'var(--semantic-background-primary)',
        'dark-foreground': '#ffffff',               /* Pure white for maximum contrast */
        'dark-card': 'var(--semantic-background-secondary)',
        'dark-card-foreground': '#ffffff',          /* Pure white for maximum contrast */
        'dark-border': 'var(--semantic-border-primary)',
        'dark-input': 'rgba(255, 255, 255, 0.12)',
        'dark-input-border': 'rgba(255, 255, 255, 0.2)',

        // Add component token colors for easy access
        'success': 'var(--semantic-success-500)',
        'warning': 'var(--semantic-warning-500)',
        'error': 'var(--semantic-danger-500)',
        'info': 'var(--semantic-primary-500)',
        
        // Hover states
        'primary-hover': 'var(--primary-hover)',
        'success-hover': 'var(--semantic-success-600)',
        'warning-hover': 'var(--semantic-warning-600)',
        'error-hover': 'var(--semantic-danger-600)',
        'info-hover': 'var(--semantic-primary-600)',
      },
      animation: {
        'wave-pulse': 'wave-pulse 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-down': 'slide-down 0.5s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-out': 'fade-out 0.5s ease-out',
        'fadeIn': 'fadeIn 0.6s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'shine': 'shine 1.5s ease-in-out',
      },
      screens: {
        // Mobile-first responsive breakpoints
        'xs': '320px',      // 최소 모바일 (iPhone SE 1st gen)
        'sm': '360px',      // 갤럭시 시리즈
        'md': '375px',      // 일반 모바일 (iPhone SE 2nd gen, iPhone 12/13/14)
        'lg': '768px',      // 태블릿 (iPad)
        'xl': '1024px',     // 데스크톱 (iPad Pro)
        '2xl': '1440px',    // 대형 화면
        '3xl': '1920px',    // 초대형 화면
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
      },
      keyframes: {
        'wave-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.7' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'glow': {
          '0%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'fadeIn': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shine': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      lineClamp: {
        '1': '1',
        '2': '2',
        '3': '3',
        '4': '4',
        '5': '5',
      },
      // Design Token: Spacing - Foundation Tokens  
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        
        // Foundation spacing tokens - using direct values for Tailwind compatibility
        'xs': '0.5rem',     // 8px
        'sm': '1rem',       // 16px
        'md': '1.5rem',     // 24px
        'lg': '2rem',       // 32px  
        'xl': '3rem',       // 48px

        // Touch targets
        'touch-min': '2.75rem',         // 44px
        'touch-comfortable': '3rem',    // 48px
        'touch-large': '3.5rem',        // 56px
      },

      // Design Token: Border Radius - Foundation Tokens
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',    // 2px
        'md': '0.375rem',    // 6px
        'lg': '0.5rem',      // 8px
        'xl': '0.75rem',     // 12px
        '2xl': '1rem',       // 16px
        'full': '9999px'
      },

      // Design Token: Box Shadow - Foundation Tokens
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', 
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'family': '0 4px 20px rgba(59, 130, 246, 0.15)',
      },

      // Design Token: Animation Duration
      transitionDuration: {
        'fast': '150ms',     // 150ms
        'normal': '300ms',   // 300ms
        'slow': '500ms',     // 500ms
      },
    },
  },
  plugins: [
    import('@tailwindcss/container-queries'),
  ],
} 