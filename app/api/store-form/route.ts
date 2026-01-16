import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { NextRequest } from 'next/server';
import { errorResponse, successResponse, apiErrors } from '@/lib/api-response';
import { storeFormSchema } from '@/lib/validation';
import { generateRequestId } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { getCachedStoreSettings } from '@/lib/cache';
import { revalidateTag } from 'next/cache';

export async function GET(req: NextRequest) {
  const requestId = generateRequestId();
  const logContext = { requestId };
  
  try {
    const session = await getSession(req);
    if (!session) {
      return apiErrors.unauthorized(requestId);
    }
    
    const { storeHash } = session;
    
    // Use cached store settings
    const settings = await getCachedStoreSettings(storeHash, () => db.getStoreSettings(storeHash));
    
    return successResponse(
      { 
        form: settings?.signupForm || null, 
        active: settings?.signupFormActive || false, 
        scriptUuid: settings?.signupScriptUuid || '' 
      },
      200,
      requestId
    );
  } catch (error: unknown) {
    logger.error('Failed to get store form', error, logContext);
    return apiErrors.internalError('Failed to retrieve store form', error, requestId);
  }
}

export async function PUT(req: NextRequest) {
  const requestId = generateRequestId();
  const logContext = { requestId };
  
  try {
    const session = await getSession(req);
    if (!session) {
      return apiErrors.unauthorized(requestId);
    }
    
    const { storeHash } = session;
    
    // Parse request body
    let body: unknown;
    try {
      body = await req.json();
    } catch (parseError) {
      return errorResponse('Invalid JSON in request body', 400, 'VALIDATION_ERROR' as any, requestId);
    }
    
    const { form, versionName, saveType } = body as { form?: unknown; versionName?: string; saveType?: string };
    
    // If versionName and saveType are provided, save as version/draft
    if (versionName && saveType && (saveType === 'draft' || saveType === 'version')) {
      if (!form) {
        return errorResponse('Missing form data', 400, 'MISSING_REQUIRED_FIELD' as any, requestId);
      }
      
      // Validate form schema
      const formValidation = storeFormSchema.safeParse(form);
      if (!formValidation.success) {
        // Use issues instead of errors (Zod uses issues property)
        const errorMessages = formValidation.error.issues ? formValidation.error.issues.map((e: any) => e.message).join(', ') : 'Validation failed';
        return errorResponse(
          `Form validation error: ${errorMessages}`,
          400,
          'VALIDATION_ERROR' as any,
          requestId
        );
      }

      // Check for duplicate form name
      const nameExists = await db.checkFormNameExists(storeHash, versionName);
      if (nameExists) {
        return errorResponse(
          'A form with this name already exists. Please use a different name.',
          409,
          'DUPLICATE_NAME' as any,
          requestId
        );
      }

      await db.saveFormVersion(storeHash, {
        name: versionName,
        type: saveType as 'draft' | 'version',
        form: formValidation.data
      });
      
      logger.info('Form version saved', { ...logContext, storeHash, versionName, saveType });
      
      return successResponse({ saved: true, type: 'version' }, 200, requestId);
    }
    
    // Otherwise, save to main form (backward compatible)
    if (!form) {
      return errorResponse('Missing form data', 400, 'MISSING_REQUIRED_FIELD' as any, requestId);
    }
    
    // Validate form schema
    const formValidation = storeFormSchema.safeParse(form);
    if (!formValidation.success) {
      // Use issues instead of errors (Zod uses issues property)
      const errorMessages = formValidation.error.issues ? formValidation.error.issues.map((e: any) => e.message).join(', ') : 'Validation failed';
      return errorResponse(
        `Form validation error: ${errorMessages}`,
        400,
        'VALIDATION_ERROR' as any,
        requestId
      );
    }
    
    await db.setStoreForm(storeHash, formValidation.data);
    
    logger.info('Store form updated', { ...logContext, storeHash });
    
    return successResponse({ saved: true }, 200, requestId);
  } catch (error: unknown) {
    logger.error('Failed to save store form', error, logContext);
    return apiErrors.internalError('Failed to save store form', error, requestId);
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
    
    // Parse request body
    let body: unknown;
    try {
      body = await req.json();
    } catch (parseError) {
      return errorResponse('Invalid JSON in request body', 400, 'VALIDATION_ERROR' as any, requestId);
    }
    
    const { action } = body as { action?: string };
    
    if (action === 'activate') {
      await db.setStoreFormActive(storeHash, true);
      // Invalidate cache so GET endpoint returns fresh data
      revalidateTag(`store-settings-${storeHash}`);
      logger.info('Store form activated', { ...logContext, storeHash });
      return successResponse({ activated: true }, 200, requestId);
    }
    
    if (action === 'deactivate') {
      await db.setStoreFormActive(storeHash, false);
      // Clear script UUID when deactivating
      await db.setStoreScriptUuid(storeHash, '');
      // Invalidate cache so GET endpoint returns fresh data
      revalidateTag(`store-settings-${storeHash}`);
      logger.info('Store form deactivated', { ...logContext, storeHash });
      return successResponse({ activated: false }, 200, requestId);
    }
    
    return errorResponse('Unknown action. Must be "activate" or "deactivate"', 400, 'VALIDATION_ERROR' as any, requestId);
  } catch (error: unknown) {
    logger.error('Failed to update form active status', error, logContext);
    return apiErrors.internalError('Failed to update form active status', error, requestId);
  }
}

