import React, { ReactNode } from 'react';
import { 
  GlassCardVariant, 
  WaveButtonVariant, 
  WaveButtonSize, 
  BaseComponentProps, 
  InteractiveComponentProps 
} from './common';

// ============================================================================
// GLASS CARD TYPES
// ============================================================================

/**
 * GlassCard 컴포넌트의 모든 가능한 variant 타입
 */
export type GlassCardVariantType = GlassCardVariant;

/**
 * GlassCard hover 효과 타입
 */
export interface GlassCardHoverEffects {
  light: string;
  medium: string;
  strong: string;
  default: string;
  elevated: string;
  interactive: string;
  family: string;
  task: string;
  member: string;
}

/**
 * GlassCard 스타일 variant 매핑
 */
export interface GlassCardVariantStyles {
  light: string;
  medium: string;
  strong: string;
  default: string;
  elevated: string;
  interactive: string;
  family: string;
  task: string;
  member: string;
}

/**
 * GlassCard Props 인터페이스
 */
export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  variant?: GlassCardVariantType;
  onClick?: () => void;
  ariaLabel?: string;
}

/**
 * GlassCard 내부 상태
 */
export interface GlassCardState {
  isClickable: boolean;
  isPressed: boolean;
  isHovered: boolean;
}

// ============================================================================
// WAVE BUTTON TYPES
// ============================================================================

/**
 * WaveButton 컴포넌트의 모든 가능한 variant 타입
 */
export type WaveButtonVariantType = WaveButtonVariant;

/**
 * WaveButton size 타입
 */
export type WaveButtonSizeType = WaveButtonSize;

/**
 * WaveButton variant 스타일 매핑
 */
export interface WaveButtonVariantStyles {
  primary: string;
  secondary: string;
  ghost: string;
  travel: string;
  default: string;
}

/**
 * WaveButton size 스타일 매핑
 */
export interface WaveButtonSizeStyles {
  sm: string;
  md: string;
  lg: string;
}

/**
 * WaveButton Props 인터페이스
 */
export interface WaveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: WaveButtonVariantType;
  size?: WaveButtonSizeType;
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-labelledby'?: string;
}

/**
 * WaveButton 내부 상태
 */
export interface WaveButtonState {
  isPressed: boolean;
  isHovered: boolean;
  isFocused: boolean;
  isDisabled: boolean;
}

/**
 * Wave 애니메이션 설정
 */
export interface WaveAnimationConfig {
  duration: number;
  delay: number;
  easing: string;
  scale: number;
}

// ============================================================================
// ANIMATION & INTERACTION TYPES
// ============================================================================

/**
 * 애니메이션 상태
 */
export interface AnimationState {
  isPressed?: boolean;
  isHovered?: boolean;
  isFocused?: boolean;
  isActive?: boolean;
  isAnimating?: boolean;
}

/**
 * 터치 상호작용 상태
 */
export interface TouchInteractionState {
  isTouching?: boolean;
  touchStartTime?: number;
  touchEndTime?: number;
  touchDuration?: number;
  touchStartPosition?: { x: number; y: number };
  touchEndPosition?: { x: number; y: number };
}

/**
 * 키보드 상호작용 상태
 */
export interface KeyboardInteractionState {
  isFocused?: boolean;
  isPressed?: boolean;
  lastKeyPressed?: string;
  keyDownTime?: number;
  keyUpTime?: number;
}

/**
 * 마우스 상호작용 상태
 */
export interface MouseInteractionState {
  isHovered?: boolean;
  isPressed?: boolean;
  mouseEnterTime?: number;
  mouseLeaveTime?: number;
  hoverDuration?: number;
}

// ============================================================================
// STYLE & THEME TYPES
// ============================================================================

/**
 * 반응형 브레이크포인트
 */
export type ResponsiveBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * 반응형 스타일 설정
 */
export interface ResponsiveStyle {
  xs?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  '2xl'?: string;
}

/**
 * Glass 효과 설정
 */
export interface GlassEffectConfig {
  blur: string;
  opacity: number;
  borderOpacity: number;
  shadowIntensity: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

/**
 * Wave 효과 설정
 */
export interface WaveEffectConfig {
  enabled: boolean;
  duration: number;
  scale: number;
  opacity: number;
  color: string;
}

/**
 * 컴포넌트 테마 설정
 */
export interface ComponentTheme {
  glass?: GlassEffectConfig;
  wave?: WaveEffectConfig;
  responsive?: ResponsiveStyle;
  animation?: {
    duration: number;
    easing: string;
    delay?: number;
  };
}

// ============================================================================
// ACCESSIBILITY TYPES
// ============================================================================

/**
 * 접근성 속성
 */
export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-labelledby'?: string;
  'aria-hidden'?: boolean;
  'aria-disabled'?: boolean;
  'aria-pressed'?: boolean;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
  role?: string;
  tabIndex?: number;
}

/**
 * 키보드 이벤트 핸들러
 */
export interface KeyboardEventHandlers {
  onKeyDown?: (event: React.KeyboardEvent) => void;
  onKeyUp?: (event: React.KeyboardEvent) => void;
  onKeyPress?: (event: React.KeyboardEvent) => void;
}

/**
 * 포커스 관리
 */
export interface FocusManagement {
  autoFocus?: boolean;
  onFocus?: (event: React.FocusEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
  onFocusIn?: (event: React.FocusEvent) => void;
  onFocusOut?: (event: React.FocusEvent) => void;
}

// ============================================================================
// PERFORMANCE & OPTIMIZATION TYPES
// ============================================================================

/**
 * 성능 최적화 설정
 */
export interface PerformanceConfig {
  debounceDelay?: number;
  throttleDelay?: number;
  lazyLoad?: boolean;
  memoize?: boolean;
  virtualize?: boolean;
}

/**
 * 메모이제이션 키
 */
export interface MemoizationKey {
  variant: string;
  size: string;
  disabled: boolean;
  loading: boolean;
  className?: string;
}

/**
 * 렌더링 최적화 설정
 */
export interface RenderOptimization {
  shouldUpdate: boolean;
  priority: 'low' | 'normal' | 'high';
  batchUpdates: boolean;
}

// ============================================================================
// EVENT HANDLER TYPES
// ============================================================================

/**
 * 클릭 이벤트 핸들러
 */
export interface ClickEventHandlers {
  onClick?: (event: React.MouseEvent) => void;
  onDoubleClick?: (event: React.MouseEvent) => void;
  onContextMenu?: (event: React.MouseEvent) => void;
}

/**
 * 마우스 이벤트 핸들러
 */
export interface MouseEventHandlers {
  onMouseEnter?: (event: React.MouseEvent) => void;
  onMouseLeave?: (event: React.MouseEvent) => void;
  onMouseDown?: (event: React.MouseEvent) => void;
  onMouseUp?: (event: React.MouseEvent) => void;
  onMouseMove?: (event: React.MouseEvent) => void;
  onMouseOver?: (event: React.MouseEvent) => void;
  onMouseOut?: (event: React.MouseEvent) => void;
}

/**
 * 터치 이벤트 핸들러
 */
export interface TouchEventHandlers {
  onTouchStart?: (event: React.TouchEvent) => void;
  onTouchEnd?: (event: React.TouchEvent) => void;
  onTouchMove?: (event: React.TouchEvent) => void;
  onTouchCancel?: (event: React.TouchEvent) => void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * 조건부 타입 - 조건에 따라 다른 타입 반환
 */
export type ConditionalType<T, U, V> = T extends true ? U : V;

/**
 * 선택적 속성 타입
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 필수 속성 타입
 */
export type MakeRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * 컴포넌트 렌더링 함수 타입
 */
export type RenderFunction<T = any> = (props: T) => ReactNode;

/**
 * 컴포넌트 ref 타입
 */
export type ComponentRef<T> = React.RefObject<T> | ((instance: T | null) => void) | null;
