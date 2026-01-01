/**
 * CORS middleware with environment-based origin whitelist
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllowedOrigins } from '../env';

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  
  const allowedOrigins = getAllowedOrigins();
  
  // If no origins configured, deny all (security by default)
  if (allowedOrigins.length === 0) {
    return false;
  }
  
  // TEMP: allow all origins if wildcard is present
  if (allowedOrigins.includes('*')) {
    return true;
  }

  return allowedOrigins.includes(origin);
}

/**
 * Apply CORS headers to response
 * For public endpoints, allows all origins if allowAllOrigins is true
 */
export function applyCorsHeaders(
  req: NextRequest,
  res: NextResponse,
  allowAllOrigins: boolean = false
): NextResponse {
  const origin = req.headers.get('origin');
  
  // For public endpoints, allow all origins
  if (allowAllOrigins) {
    if (origin) {
      res.headers.set('Access-Control-Allow-Origin', origin);
      res.headers.set('Access-Control-Allow-Credentials', 'true');
    } else {
      // If no origin header, allow all (wildcard)
      res.headers.set('Access-Control-Allow-Origin', '*');
    }
  } else if (origin && isOriginAllowed(origin)) {
    // Standard CORS check for non-public endpoints
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Access-Control-Allow-Credentials', 'true');
  } else {
    // No origin or not allowed - don't set CORS headers
    // This effectively blocks cross-origin requests
    return res;
  }
  
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key, ngrok-skip-browser-warning, Accept');
  res.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  
  return res;
}

/**
 * Handle OPTIONS preflight request
 * For public endpoints, allows all origins if configured
 */
export function handleCorsPreflight(req: NextRequest, allowAllOrigins: boolean = false): NextResponse {
  const res = new NextResponse(null, { status: 204 });
  return applyCorsHeaders(req, res, allowAllOrigins);
}

