// Typography system types

// Typography variants that match the component system
export type TypographyVariant = 
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'body-large' | 'body' | 'body-small'
  | 'caption' | 'label' | 'display' | 'code' | 'quote';

// Font sizes for Korean-optimized text
export type FontSize = 
  | 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';

// Font weights
export type FontWeight = 
  | 'thin' | 'extralight' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';

// Text alignment
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

// Typography color semantics
export type TypographyColor = 
  | 'primary' | 'secondary' | 'muted' | 'accent' | 'destructive' 
  | 'success' | 'warning' | 'error' | 'info';

// Line height variants
export type LineHeight = 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose';

// Letter spacing for Korean text
export type LetterSpacing = 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest';

// Typography configuration interface
export interface TypographyConfig {
  variant: TypographyVariant;
  size?: FontSize;
  weight?: FontWeight;
  align?: TextAlign;
  color?: TypographyColor;
  lineHeight?: LineHeight;
  letterSpacing?: LetterSpacing;
  className?: string;
}

// Font loading states
export interface FontLoadingState {
  family: string;
  loaded: boolean;
  failed: boolean;
  loading: boolean;
}

// Typography accessibility settings
export interface TypographyAccessibility {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  lineHeight: LineHeight;
  letterSpacing: LetterSpacing;
  highContrast: boolean;
  reduceMotion: boolean;
  preferredFont?: string;
}

// Semantic text content types for better organization
export interface SemanticTextContent {
  // Titles and headers
  pageTitle: string;
  sectionTitle: string;
  cardTitle: string;
  dialogTitle: string;
  
  // Descriptions and body text
  description: string;
  excerpt: string;
  content: string;
  
  // Labels and metadata
  label: string;
  placeholder: string;
  helperText: string;
  errorMessage: string;
  successMessage: string;
  
  // Navigation and actions
  buttonText: string;
  linkText: string;
  menuItem: string;
  breadcrumb: string;
}

// Typography theme configuration
export interface TypographyTheme {
  fontFamily: {
    primary: string;
    secondary?: string;
    mono: string;
  };
  
  fontSize: Record<FontSize, string>;
  fontWeight: Record<FontWeight, number>;
  lineHeight: Record<LineHeight, number>;
  letterSpacing: Record<LetterSpacing, string>;
  
  colors: Record<TypographyColor, string>;
  
  // Korean-specific settings
  koreanOptimized: {
    breakKeep: boolean;
    wordBreak: 'normal' | 'break-all' | 'keep-all';
    hyphens: 'none' | 'manual' | 'auto';
  };
}

// Typography component props interface
export interface TypographyProps {
  children: React.ReactNode;
  variant?: TypographyVariant;
  size?: FontSize;
  weight?: FontWeight;
  align?: TextAlign;
  color?: TypographyColor;
  lineHeight?: LineHeight;
  letterSpacing?: LetterSpacing;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  truncate?: boolean;
  noWrap?: boolean;
}

// Text content validation and formatting
export interface TextContentRules {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  required?: boolean;
  sanitize?: boolean;
  allowMarkdown?: boolean;
}

// Typography metrics for performance monitoring
export interface TypographyMetrics {
  fontLoadTime: number;
  renderTime: number;
  textLength: number;
  readabilityScore?: number;
}