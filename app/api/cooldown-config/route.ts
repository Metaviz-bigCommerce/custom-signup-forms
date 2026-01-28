import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { NextRequest } from 'next/server';
import { errorResponse, successResponse, apiErrors, ErrorCode } from '@/lib/api-response';
import { cooldownConfigSchema } from '@/lib/validation';
import { generateRequestId } from '@/lib/utils';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const requestId = generateRequestId();
  const logContext = { requestId };
  
  try {
    const session = await getSession(req);
    if (!session) {
      return apiErrors.unauthorized(requestId);
    }
    
    const { storeHash } = session;
    const cooldownPeriod = await db.getCooldownPeriod(storeHash);
    
    return successResponse(
      { days: cooldownPeriod },
      200,
      requestId
    );
  } catch (error: unknown) {
    logger.error('Failed to get cooldown config', error, logContext);
    return apiErrors.internalError('Failed to retrieve cooldown configuration', error, requestId);
  }
}

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  const logContext = { requestId };
  
  try {
    const session = await getSession(req);
    if (!session) {
      return apiErrors.unauthorized(requestId);
    }
    
    const { storeHash } = session;
    
    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON in request body', 400, ErrorCode.VALIDATION_ERROR, requestId);
    }
    
    const validation = cooldownConfigSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(
        `Validation error: ${validation.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400,
        ErrorCode.VALIDATION_ERROR,
        requestId
      );
    }
    
    const { days } = validation.data;
    await db.setCooldownPeriod(storeHash, days);
    
    logger.info('Cooldown period updated', { ...logContext, storeHash, days });
    
    return successResponse({ updated: true, days }, 200, requestId);
  } catch (error: unknown) {
    logger.error('Failed to update cooldown config', error, logContext);
    return apiErrors.internalError('Failed to update cooldown configuration', error, requestId);
  }
}

