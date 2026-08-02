/**
 * Minimal structured logger. Swap this out for winston/pino later
 * without touching call sites elsewhere in the codebase.
 */
type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  const line = `[${timestamp}] [${level}] ${message}${metaStr}`;
  if (level === 'ERROR') {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log('INFO', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('WARN', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('ERROR', message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production') {
      log('DEBUG', message, meta);
    }
  },
};
