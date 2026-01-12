/**
 * Session logging middleware
 * Extracts session ID from cookies and logs all requests to session-specific files
 */

import type { Request, Response, NextFunction } from 'express';
import {
  parseSessionIdFromCookies,
  generateSessionId,
  sessionLogInfo,
  sessionLogDebug,
  SESSION_COOKIE_NAME,
} from '../config/session-logger.js';

// Extend Express Request to include sessionId
declare global {
  namespace Express {
    interface Request {
      sessionId?: string;
    }
  }
}

/**
 * Middleware to extract or create session ID and log requests
 */
export function sessionLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Extract session ID from cookie or create new one
  const cookieHeader = req.headers.cookie;
  let sessionId = parseSessionIdFromCookies(cookieHeader);
  const isNewSession = !sessionId;

  if (!sessionId) {
    sessionId = generateSessionId();
  }

  // Attach to request for use in routes
  req.sessionId = sessionId;

  // Skip health check logging
  if (req.url === '/api/v1/health') {
    return next();
  }

  // Get auth header info (without exposing token)
  const authHeader = req.headers.authorization;
  const hasAuthHeader = !!authHeader;
  const authType = authHeader?.split(' ')[0] || null;

  // Log incoming request
  sessionLogInfo(sessionId, 'Request', 'Incoming request', {
    method: req.method,
    url: req.url,
    path: req.path,
    hasAuthHeader,
    authType,
    isNewSession,
    origin: req.headers.origin || 'none',
    userAgent: req.headers['user-agent']?.substring(0, 100) || 'unknown',
    contentType: req.headers['content-type'] || 'none',
    cookies: cookieHeader ? Object.keys(parseCookies(cookieHeader)) : [],
  });

  // Track response
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    sessionLogInfo(sessionId!, 'Response', 'Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      success: res.statusCode < 400,
    });
  });

  // Set session cookie if new (for CORS, this needs proper configuration)
  if (isNewSession) {
    res.cookie(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });
  }

  next();
}

// Helper to parse cookies
function parseCookies(cookieHeader: string): Record<string, string> {
  return cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, string>);
}

/**
 * Helper function to get session logger for use in route handlers
 */
export function getSessionLogger(req: { sessionId?: string }) {
  const sessionId = req.sessionId || 'unknown';

  return {
    info: (source: string, message: string, data?: Record<string, unknown>) =>
      sessionLogInfo(sessionId, source, message, data),
    warn: (source: string, message: string, data?: Record<string, unknown>) =>
      sessionLogDebug(sessionId, source, message, data),
    error: (source: string, message: string, data?: Record<string, unknown>) =>
      sessionLogDebug(sessionId, source, message, data),
    debug: (source: string, message: string, data?: Record<string, unknown>) =>
      sessionLogDebug(sessionId, source, message, data),
  };
}
