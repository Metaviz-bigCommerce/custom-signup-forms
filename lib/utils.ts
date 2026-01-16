/**
 * Shared utility functions used across the application
 */

/**
 * Extract name from form data object
 * Tries common field names and fuzzy matching
 */
export function extractName(data: Record<string, unknown>): string {
  if (!data || typeof data !== 'object') return '';
  
  const entries = Object.entries(data);
  const candidates = ['name', 'full_name', 'full name', 'first_name', 'first name'];
  
  for (const key of candidates) {
    const found = entries.find(([k]) => k.toLowerCase() === key);
    if (found && found[1] != null) {
      return String(found[1]);
    }
  }
  
  // Fuzzy: field containing 'name'
  const fuzzy = entries.find(([k]) => /name/i.test(k));
  if (fuzzy && fuzzy[1] != null) {
    return String(fuzzy[1]);
  }
  
  return '';
}

/**
 * Extract email from form data object
 * Tries common field names and fuzzy matching
 */
export function extractEmail(data: Record<string, unknown>): string {
  if (!data || typeof data !== 'object') return '';
  
  const entries = Object.entries(data);
  const candidates = ['email', 'e-mail', 'email_address', 'email address'];
  
  for (const key of candidates) {
    const found = entries.find(([k]) => k.toLowerCase() === key);
    if (found && found[1] != null) {
      const email = String(found[1]).trim().toLowerCase();
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return email;
      }
    }
  }
  
  // Fuzzy: field containing 'email'
  const fuzzy = entries.find(([k]) => /email/i.test(k));
  if (fuzzy && fuzzy[1] != null) {
    const email = String(fuzzy[1]).trim().toLowerCase();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return email;
    }
  }
  
  return '';
}

/**
 * Format date from various formats (Firestore timestamp, ISO string, etc.)
 */
export function formatDate(timestamp: unknown): string {
  if (!timestamp) return '';
  
  if (typeof timestamp === 'string') {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return '';
    }
  }
  
  if (typeof timestamp === 'object' && timestamp !== null) {
    const ts = timestamp as { seconds?: number; nanoseconds?: number };
    if (typeof ts.seconds === 'number') {
      return new Date(ts.seconds * 1000).toLocaleString();
    }
  }
  
  if (timestamp instanceof Date) {
    return timestamp.toLocaleString();
  }
  
  return '';
}

/**
 * Get basename from a path or URL
 */
export function basename(value: unknown): string {
  const s = String(value ?? '');
  if (!s) return s;
  
  // If looks like URL or path, reduce to filename
  if (s.includes('/') || s.includes('\\')) {
    const parts = s.split(/[/\\]/);
    return parts[parts.length - 1] || s;
  }
  
  return s;
}

/**
 * Generate a unique request ID for tracking
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: unknown, maxLength = 10000): string {
  if (typeof input !== 'string') return '';
  
  // Truncate if too long
  const truncated = input.length > maxLength ? input.substring(0, maxLength) : input;
  
  // Remove potentially dangerous characters but keep most unicode
  return truncated
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
}

/**
 * Convert technical error messages to user-friendly messages
 * Removes technical details like HTTP status codes, stack traces, and internal error details
 */
export function getUserFriendlyError(error: unknown, defaultMessage?: string): string {
  // Handle different error types
  let errorMessage = '';
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = String((error as { message: unknown }).message);
  } else {
    errorMessage = String(error || '');
  }

  // Default user-friendly message if needed
  const defaultMsg = defaultMessage || 'Something went wrong. Please try again.';

  // If error is empty or just whitespace, return default
  if (!errorMessage || !errorMessage.trim()) {
    return defaultMsg;
  }

  // Remove HTTP status codes and technical prefixes
  errorMessage = errorMessage
    .replace(/^(Failed to (fetch|load|save|delete|update|activate|deactivate|approve|reject|send)):\s*\d+\s*/i, '$1')
    .replace(/\s*\d{3}\s*(error|status)?/i, '')
    .replace(/HTTP\s*\d+/gi, '')
    .replace(/status\s*:\s*\d+/gi, '')
    .replace(/error\s*code\s*:\s*\d+/gi, '');

  // Remove technical prefixes
  errorMessage = errorMessage
    .replace(/^(API\s*)?error\s*:?\s*/i, '')
    .replace(/^(Network|Connection|Fetch|Request)\s*error\s*:?\s*/i, '')
    .replace(/^Error\s*:?\s*/i, '');

  // Remove stack traces and technical details (anything after newlines or special characters)
  errorMessage = errorMessage.split('\n')[0].split('\r')[0].trim();

  // Remove JSON/object representations
  if (errorMessage.includes('{') || errorMessage.includes('[')) {
    return defaultMsg;
  }

  // Check for common technical error patterns and replace with user-friendly messages
  const technicalPatterns: Array<[RegExp, string]> = [
    [/session\s*not\s*found/i, 'Please refresh the page and try again.'],
    [/unauthorized|401/i, 'Your session has expired. Please refresh the page.'],
    [/forbidden|403/i, 'You don\'t have permission to perform this action.'],
    [/not\s*found|404/i, 'The requested item could not be found.'],
    [/form with this name already exists/i, 'A form with this name already exists. Please use a different name.'],
    [/conflict|409/i, 'This action conflicts with the current state. Please refresh and try again.'],
    [/validation|422/i, 'Please check your input and try again.'],
    [/too\s*many\s*requests|429/i, 'Too many requests. Please wait a moment and try again.'],
    [/server\s*error|500|502|503|504/i, 'Our servers are experiencing issues. Please try again in a moment.'],
    [/network|connection|failed\s*to\s*fetch/i, 'Network connection issue. Please check your internet and try again.'],
    [/timeout/i, 'The request took too long. Please try again.'],
    [/no\s*context\s*available/i, 'Please refresh the page to continue.'],
    [/json\s*parse/i, 'Invalid data format. Please try again.'],
    [/unknown\s*error/i, defaultMsg],
  ];

  for (const [pattern, friendlyMsg] of technicalPatterns) {
    if (pattern.test(errorMessage)) {
      return friendlyMsg;
    }
  }

  // If message is too technical (contains technical keywords), return default
  const technicalKeywords = [
    'status', 'code', 'stack', 'trace', 'exception', 'throw', 'catch',
    'promise', 'rejected', 'undefined', 'null', 'object', 'typeerror',
    'referenceerror', 'syntaxerror', 'networkerror'
  ];
  
  const lowerMessage = errorMessage.toLowerCase();
  if (technicalKeywords.some(keyword => lowerMessage.includes(keyword) && errorMessage.length < 100)) {
    return defaultMsg;
  }

  // If message looks like it might be a raw API response or JSON, return default
  if (errorMessage.startsWith('{') || errorMessage.startsWith('[') || errorMessage.includes('"error"')) {
    return defaultMsg;
  }

  // Clean up the message: remove extra whitespace, capitalize first letter
  errorMessage = errorMessage.trim().replace(/\s+/g, ' ');
  if (errorMessage.length > 0) {
    errorMessage = errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1);
  }

  // If cleaned message is empty or too short/suspicious, return default
  if (!errorMessage || errorMessage.length < 3) {
    return defaultMsg;
  }

  return errorMessage;
}

