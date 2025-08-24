// eslint-disable-next-line no-console

// Lightweight logger with environment-aware levels
// - In development: debug/info/warn/error 출력
// - In production: warn/error 기본 출력 (VITE_LOG_LEVEL로 조정 가능)

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

type ViteEnv = { DEV?: boolean; VITE_LOG_LEVEL?: LogLevel } | undefined;
const viteEnv: ViteEnv = (() => {
  try {
    const env = (
      globalThis as unknown as { import?: { meta?: { env?: ViteEnv } } }
    )?.import?.meta?.env;
    return env;
  } catch {
    return undefined;
  }
})();
const isDev: boolean =
  !!viteEnv?.DEV ||
  process.env.NODE_ENV === 'test' ||
  process.env.NODE_ENV === 'development';

const levelRank: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  none: 100,
};

let currentLevel: LogLevel =
  viteEnv?.VITE_LOG_LEVEL || (isDev ? 'debug' : 'warn');

export const setLogLevel = (level: LogLevel) => {
  currentLevel = level;
};

function shouldLog(level: LogLevel): boolean {
  return levelRank[level] >= levelRank[currentLevel];
}

function formatArgs(args: unknown[]): unknown[] {
  return args;
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog('debug')) {
      console.debug(...formatArgs(args));
    }
  },
  info: (...args: unknown[]) => {
    if (shouldLog('info')) {
      console.info(...formatArgs(args));
    }
  },
  warn: (...args: unknown[]) => {
    if (shouldLog('warn')) {
      console.warn(...formatArgs(args));
    }
  },
  error: (...args: unknown[]) => {
    if (shouldLog('error')) {
      console.error(...formatArgs(args));
    }
  },
};

export default logger;
