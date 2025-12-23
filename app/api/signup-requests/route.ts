import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { NextRequest } from 'next/server';
import { trySendTemplatedEmail } from '@/lib/email';
import { errorResponse, successResponse, apiErrors, ErrorCode } from '@/lib/api-response';
import { signupRequestStatusSchema, requestIdSchema } from '@/lib/validation';
import { extractName } from '@/lib/utils';
import { generateRequestId } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';

export async function GET(req: NextRequest) {
  const requestId = generateRequestId();
  const logContext = { requestId };
  
  try {
    const session = await getSession(req);
    if (!session) {
      return apiErrors.unauthorized(requestId);
    }
    
    const { storeHash } = session;
    const pageSizeParam = req.nextUrl.searchParams.get('pageSize');
    const pageSize = pageSizeParam ? Number(pageSizeParam) : 10;
    
    // Validate pageSize
    if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
      return errorResponse('pageSize must be between 1 and 100', 400, ErrorCode.VALIDATION_ERROR, requestId);
    }
    
    const cursor = req.nextUrl.searchParams.get('cursor') || undefined;
    const statusParam = req.nextUrl.searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;
    const status = statusParam && ['pending', 'approved', 'rejected'].includes(statusParam) ? statusParam : undefined;
    
    const result = await db.listSignupRequests(storeHash, { pageSize, cursor, status });
    
    return successResponse(
      { items: result.items, nextCursor: result.nextCursor },
      200,
      requestId
    );
  } catch (error: unknown) {
    logger.error('Failed to list signup requests', error, logContext);
    return apiErrors.internalError('Failed to retrieve signup requests', error, requestId);
  }
}

export async function DELETE(req: NextRequest) {
  const requestId = generateRequestId();
  const logContext = { requestId };
  
  try {
    const session = await getSession(req);
    if (!session) {
      return apiErrors.unauthorized(requestId);
    }
    
    const { storeHash } = session;
    const idParam = req.nextUrl.searchParams.get('id') || '';
    
    // Validate request ID
    const idValidation = requestIdSchema.safeParse(idParam);
    if (!idValidation.success) {
      return errorResponse('Invalid request ID', 400, ErrorCode.VALIDATION_ERROR, requestId);
    }
    
    const id = idValidation.data;
    await db.deleteSignupRequest(storeHash, id);
    
    logger.info('Signup request deleted', { ...logContext, storeHash, requestId: id });
    
    return successResponse({ deleted: true }, 200, requestId);
  } catch (error: unknown) {
    logger.error('Failed to delete signup request', error, logContext);
    return apiErrors.internalError('Failed to delete signup request', error, requestId);
  }
}

export async function PATCH(req: NextRequest) {
  const requestId = generateRequestId();
  const logContext = { requestId };
  
  try {
    const session = await getSession(req);
    if (!session) {
      return apiErrors.unauthorized(requestId);
    }
    
    const { storeHash } = session;
    const idParam = req.nextUrl.searchParams.get('id') || '';
    
    // Validate request ID
    const idValidation = requestIdSchema.safeParse(idParam);
    if (!idValidation.success) {
      return errorResponse('Invalid request ID', 400, ErrorCode.VALIDATION_ERROR, requestId);
    }
    
    const id = idValidation.data;
    
    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch (parseError) {
      return errorResponse('Invalid JSON in request body', 400, ErrorCode.VALIDATION_ERROR, requestId);
    }
    
    const statusValidation = signupRequestStatusSchema.safeParse(body);
    if (!statusValidation.success) {
      return errorResponse(
        `Validation error: ${statusValidation.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400,
        ErrorCode.VALIDATION_ERROR,
        requestId
      );
    }
    
    const { status } = statusValidation.data;
    
    // Update status
    await db.updateSignupRequestStatus(storeHash, id, status);
    
    logger.info('Signup request status updated', { ...logContext, storeHash, requestId: id, status });
    
    // Send email notification (best-effort, don't fail request)
    try {
      const request = await db.getSignupRequest(storeHash, id);
      if (request) {
        const templates = await db.getEmailTemplates(storeHash);
        const config = await db.getEmailConfig(storeHash);
        const name = extractName(request.data || {});
        const email = request.email || null;
        const platformName = env.PLATFORM_NAME || storeHash || 'Store';
        const template = status === 'approved' ? templates.approval : status === 'rejected' ? templates.rejection : null;
        
        if (template && email) {
          await trySendTemplatedEmail({
            to: email,
            template,
            vars: {
              name,
              email: email || '',
              date: new Date().toLocaleString(),
              store_name: platformName,
              platform_name: platformName,
            },
            replyTo: config?.replyTo || undefined,
            config,
            templateKey: status === 'approved' ? 'approval' : status === 'rejected' ? 'rejection' : undefined,
          });
          
          logger.info('Status update email sent', { ...logContext, email, status });
        }
      }
    } catch (emailError) {
      logger.error('Failed to send status update email', emailError, { ...logContext, requestId: id, status });
      // Don't fail the request if email fails
    }
    
    return successResponse({ updated: true, status }, 200, requestId);
  } catch (error: unknown) {
    logger.error('Failed to update signup request status', error, logContext);
    return apiErrors.internalError('Failed to update signup request status', error, requestId);
  }
}


