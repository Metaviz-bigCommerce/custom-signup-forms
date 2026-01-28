import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { NextRequest } from 'next/server';
import { errorResponse, successResponse, apiErrors, ErrorCode } from '@/lib/api-response';
import { resetCooldownSchema } from '@/lib/validation';
import { generateRequestId } from '@/lib/utils';
import { logger } from '@/lib/logger';

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
    
    const validation = resetCooldownSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(
        `Validation error: ${validation.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400,
        ErrorCode.VALIDATION_ERROR,
        requestId
      );
    }
    
    const { email } = validation.data;
    await db.resetCooldownForEmail(storeHash, email);
    
    logger.info('Cooldown reset for email', { ...logContext, storeHash, email });
    
    return successResponse({ reset: true, email }, 200, requestId);
  } catch (error: unknown) {
    logger.error('Failed to reset cooldown', error, logContext);
    return apiErrors.internalError('Failed to reset cooldown', error, requestId);
  }
}

