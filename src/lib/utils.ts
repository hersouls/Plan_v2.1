/* eslint-disable no-console */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return '방금 전';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}주 전`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}개월 전`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}년 전`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

// Lightweight logger with DEV guard, tagging, and sensitive data masking
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function maskSensitive(input: unknown): unknown {
  const SENSITIVE_KEYS = new Set([
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'authorization',
    'auth',
    'secret',
    'apiKey',
    'email',
    'phone',
    'uid',
  ]);

  try {
    if (input === null || input === undefined) return input;
    if (typeof input === 'string') {
      // Basic email masking
      const maskedEmail = input.replace(
        /([\w.-])([\w.-]*)(@[\w.-]+)/g,
        (_m, a, b, c) => `${a}${'*'.repeat(Math.min(4, b.length))}${c}`
      );
      // Basic token masking
      return maskedEmail.replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, '$1***');
    }
    if (Array.isArray(input)) {
      return input.map(item => maskSensitive(item));
    }
    if (typeof input === 'object') {
      const obj: Record<string, unknown> = input as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (SENSITIVE_KEYS.has(key)) {
          out[key] = '***';
        } else {
          out[key] = maskSensitive(value);
        }
      }
      return out;
    }
    return input;
  } catch {
    return '***';
  }
}

function log(level: LogLevel, tag: string, ...args: unknown[]) {
  const ts = new Date().toISOString();
  const safeArgs = args.map(a => maskSensitive(a));

  // In production, keep error logs; reduce noise for others
  const isDev = (() => {
    try {
      // Vite 환경 (안전 접근)
      type ViteEnv = { DEV?: boolean };
      type ViteGlobal = { import?: { meta?: { env?: ViteEnv } } };
      const viteEnv = (globalThis as unknown as ViteGlobal)?.import?.meta?.env;
      if (viteEnv && typeof viteEnv.DEV !== 'undefined') {
        return Boolean(viteEnv.DEV);
      }
    } catch {
      /* noop */
    }
    const nodeEnv =
      (typeof process !== 'undefined' && process.env?.NODE_ENV) || '';
    return nodeEnv === 'development' || nodeEnv === 'test';
  })();
  if (!isDev && level !== 'error' && level !== 'warn') return;

  const prefix = `[${ts}] [${tag}] [${level.toUpperCase()}]`;

  const fn =
    level === 'debug'
      ? console.debug
      : level === 'info'
      ? console.info
      : level === 'warn'
      ? console.warn
      : console.error;
  try {
    fn(prefix, ...safeArgs);
  } catch {
    try {
      fn(prefix, JSON.stringify(safeArgs));
    } catch {
      fn(prefix, '<<unserializable>>');
    }
  }
}

export const logger = {
  debug: (tag: string, ...args: unknown[]) => log('debug', tag, ...args),
  info: (tag: string, ...args: unknown[]) => log('info', tag, ...args),
  warn: (tag: string, ...args: unknown[]) => log('warn', tag, ...args),
  error: (tag: string, ...args: unknown[]) => log('error', tag, ...args),
};
