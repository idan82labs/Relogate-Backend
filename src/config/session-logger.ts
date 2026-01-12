/**
 * Session-based file logger for debugging auth flow
 * Logs are written to /logs/<session-id>.log
 * Uses the same session ID as the frontend for unified logging
 */

import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { logger } from './logger.js';

const LOGS_DIR = join(process.cwd(), 'logs');

// Session cookie name (must match frontend)
export const SESSION_COOKIE_NAME = 'relogate_log_session';

// Ensure logs directory exists
function ensureLogsDir(): void {
  if (!existsSync(LOGS_DIR)) {
    mkdirSync(LOGS_DIR, { recursive: true });
  }
}

// Generate a unique session ID (same format as frontend)
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

// Format log entry
function formatLogEntry(
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
  source: string,
  message: string,
  data?: Record<string, unknown>
): string {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${level}] [BACKEND] [${source}] ${message}${dataStr}\n`;
}

// Write log to session file
export function writeSessionLog(
  sessionId: string,
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
  source: string,
  message: string,
  data?: Record<string, unknown>
): void {
  try {
    ensureLogsDir();
    const logFile = join(LOGS_DIR, `${sessionId}.log`);
    const entry = formatLogEntry(level, source, message, data);

    // Also log to Pino for console output
    const logData = { sessionId, source, ...data };
    switch (level) {
      case 'ERROR':
        logger.error(logData, `[Session] ${message}`);
        break;
      case 'WARN':
        logger.warn(logData, `[Session] ${message}`);
        break;
      case 'DEBUG':
        logger.debug(logData, `[Session] ${message}`);
        break;
      default:
        logger.info(logData, `[Session] ${message}`);
    }

    // Append to session log file
    appendFileSync(logFile, entry, 'utf-8');
  } catch (error) {
    logger.error({ error }, 'Failed to write session log');
  }
}

// Convenience methods
export function sessionLogInfo(sessionId: string, source: string, message: string, data?: Record<string, unknown>): void {
  writeSessionLog(sessionId, 'INFO', source, message, data);
}

export function sessionLogWarn(sessionId: string, source: string, message: string, data?: Record<string, unknown>): void {
  writeSessionLog(sessionId, 'WARN', source, message, data);
}

export function sessionLogError(sessionId: string, source: string, message: string, data?: Record<string, unknown>): void {
  writeSessionLog(sessionId, 'ERROR', source, message, data);
}

export function sessionLogDebug(sessionId: string, source: string, message: string, data?: Record<string, unknown>): void {
  writeSessionLog(sessionId, 'DEBUG', source, message, data);
}

// Parse session ID from cookie header
export function parseSessionIdFromCookies(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, string>);

  return cookies[SESSION_COOKIE_NAME] || null;
}
