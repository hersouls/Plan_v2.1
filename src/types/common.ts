// Common types used across the application
import { SemanticTextContent, TypographyColor } from './typography';

// Base entity interface
export interface BaseEntity {
  id: string;
  createdAt: Date | FirebaseTimestamp;
  updatedAt?: Date | FirebaseTimestamp;
}

// Firebase Timestamp type for better type safety
export interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
  toMillis(): number;
}

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    version: string;
    pagination?: PaginationMeta;
  };
}

// Pagination metadata
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Sort configuration
export interface SortConfig<T = string> {
  field: T;
  direction: 'asc' | 'desc';
}

// Filter configuration
export interface FilterConfig {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: any;
}

// Search configuration
export interface SearchConfig {
  query: string;
  fields: string[];
  fuzzy?: boolean;
}

// Loading state
export interface LoadingState {
  loading: boolean;
  error: string | null;
  lastUpdated?: Date;
}

// Action result
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// File upload types
export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
}

// Theme colors
export type ThemeColor = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info';

// Size variants - WaveButton size와 통합
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Component variant types - GlassCard와 WaveButton variant 통합
export type Variant = 
  | 'default' 
  | 'primary' 
  | 'secondary' 
  | 'outline' 
  | 'ghost' 
  | 'link'
  | 'travel'; // WaveButton 추가 variant

// GlassCard specific variants
export type GlassCardVariant = 
  | 'light' 
  | 'medium' 
  | 'strong' 
  | 'default' 
  | 'elevated' 
  | 'interactive' 
  | 'family' 
  | 'task' 
  | 'member';

// WaveButton specific variants
export type WaveButtonVariant = 'primary' | 'secondary' | 'ghost' | 'travel' | 'default';

// WaveButton size variants
export type WaveButtonSize = 'sm' | 'md' | 'lg';

// Position types
export type Position = 
  | 'top' 
  | 'bottom' 
  | 'left' 
  | 'right' 
  | 'top-left' 
  | 'top-right' 
  | 'bottom-left' 
  | 'bottom-right';

// Modal/Dialog sizes
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// Typography-aware notification interface
export interface TypedNotification extends Pick<SemanticTextContent, 'cardTitle' | 'description'> {
  id: string;
  type: NotificationType;
  title: string; // Alias for cardTitle
  message: string; // Alias for description
  color?: TypographyColor;
  duration?: number;
  dismissible?: boolean;
}

// Date range
export interface DateRange {
  start: Date;
  end: Date;
}

// Time range
export interface TimeRange {
  start: string; // HH:mm format
  end: string;   // HH:mm format
}

// Coordinates
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Address
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Contact information
export interface ContactInfo {
  email?: string;
  phone?: string;
  website?: string;
  address?: Address;
}

// Social links
export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  github?: string;
}

// Language code
export type LanguageCode = 'ko' | 'en' | 'ja' | 'zh' | 'es' | 'fr' | 'de';

// Timezone
export type Timezone = string; // IANA timezone identifier

// Currency code
export type CurrencyCode = 'KRW' | 'USD' | 'EUR' | 'JPY' | 'CNY';

// Device type
export type DeviceType = 'desktop' | 'tablet' | 'mobile';

// Browser type
export type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge' | 'other';

// Environment
export type Environment = 'development' | 'staging' | 'production';

// Log level
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Event types for analytics
export interface AnalyticsEvent {
  name: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  properties?: Record<string, any>;
  timestamp?: Date;
}

// Error boundary state
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: {
    componentStack: string;
  };
}

// Feature flag
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  conditions?: {
    userRole?: string[];
    environment?: Environment[];
    percentage?: number;
  };
}

// A/B Test variant
export interface ABTestVariant {
  id: string;
  name: string;
  weight: number;
  config: Record<string, any>;
}

// Performance metrics
export interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

// Cache configuration
export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize?: number;
  strategy: 'lru' | 'fifo' | 'lifo';
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  delay: number;
  backoff: 'linear' | 'exponential';
  retryCondition?: (error: any) => boolean;
}

// UI Component Base Props
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-labelledby'?: string;
}

// Interactive Component Props
export interface InteractiveComponentProps extends BaseComponentProps {
  onClick?: () => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  disabled?: boolean;
  tabIndex?: number;
}