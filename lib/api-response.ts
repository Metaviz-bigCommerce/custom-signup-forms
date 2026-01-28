/**
 * Standardized API response utilities
 */

import { NextResponse } from 'next/server';
import { isDev } from './env';
import { logger } from './logger';

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  
  // Resources
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE = 'DUPLICATE',
  CONFLICT = 'CONFLICT',
  
  // Server
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Business Logic
  OPERATION_FAILED = 'OPERATION_FAILED',
  INVALID_STATE = 'INVALID_STATE',
}

export interface ApiErrorResponse {
  error: true;
  message: string;
  code: ErrorCode;
  timestamp: string;
  requestId?: string;
  details?: unknown; // Only in development
}

export interface ApiSuccessResponse<T = unknown> {
  error: false;
  data: T;
  timestamp: string;
  requestId?: string;
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  message: string,
  status: number,
  code: ErrorCode = ErrorCode.INTERNAL_ERROR,
  requestId?: string,
  error?: Error | unknown
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    error: true,
    message: isDev ? message : sanitizeErrorMessage(message),
    code,
    timestamp: new Date().toISOString(),
    requestId,
  };
  
  // Include error details in development
  if (isDev && error) {
    response.details = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : String(error);
  }
  
  // Log error
  logger.error('API Error', error, { requestId, code, status, message });
  
  return NextResponse.json(response, { status });
}

/**
 * Create a standardized success response
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  requestId?: string
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    error: false,
    data,
    timestamp: new Date().toISOString(),
    requestId,
  };
  
  return NextResponse.json(response, { status });
}

/**
 * Sanitize error messages for production
 */
function sanitizeErrorMessage(message: string): string {
  // Remove stack traces and internal details
  const sanitized = message
    .split('\n')[0] // Take only first line
    .replace(/at\s+.*/g, '') // Remove stack trace patterns
    .replace(/Error:\s*/g, '')
    .trim();
  
  // Map common technical errors to user-friendly messages
  const errorMap: Record<string, string> = {
    'ECONNREFUSED': 'Service temporarily unavailable. Please try again later.',
    'ETIMEDOUT': 'Request timed out. Please try again.',
    'ENOTFOUND': 'Service unavailable. Please try again later.',
    'Validation error': 'Invalid input provided.',
    'Missing required': 'Required information is missing.',
  };
  
  for (const [key, value] of Object.entries(errorMap)) {
    if (sanitized.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Generic fallback
  if (sanitized.length > 200) {
    return 'An error occurred. Please try again or contact support.';
  }
  
  return sanitized || 'An error occurred. Please try again.';
}

/**
 * Common error responses
 */
export const apiErrors = {
  unauthorized: (requestId?: string) => errorResponse(
    'Authentication required',
    401,
    ErrorCode.UNAUTHORIZED,
    requestId
  ),
  
  forbidden: (requestId?: string) => errorResponse(
    'Access denied',
    403,
    ErrorCode.FORBIDDEN,
    requestId
  ),
  
  notFound: (resource: string, requestId?: string) => errorResponse(
    `${resource} not found`,
    404,
    ErrorCode.NOT_FOUND,
    requestId
  ),
  
  validationError: (message: string, requestId?: string) => errorResponse(
    message,
    400,
    ErrorCode.VALIDATION_ERROR,
    requestId
  ),
  
  duplicate: (message: string, requestId?: string) => errorResponse(
    message,
    409,
    ErrorCode.DUPLICATE,
    requestId
  ),
  
  internalError: (message: string, error?: Error | unknown, requestId?: string) => errorResponse(
    message,
    500,
    ErrorCode.INTERNAL_ERROR,
    requestId,
    error
  ),
};

