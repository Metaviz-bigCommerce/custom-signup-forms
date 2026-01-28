import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { NextRequest } from 'next/server';
import { errorResponse, successResponse, apiErrors } from '@/lib/api-response';
import { generateRequestId } from '@/lib/utils';
import { logger } from '@/lib/logger';
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
    const versions = await db.listFormVersions(storeHash);
    
    // Ensure timestamps are properly serialized
    const serializedVersions = versions.map((v: unknown) => {
      const version = v as { createdAt?: unknown; updatedAt?: unknown; [key: string]: unknown };
      return {
        ...version,
        createdAt: version.createdAt || null,
        updatedAt: version.updatedAt || null,
      };
    });
    
    return successResponse({ versions: serializedVersions }, 200, requestId);
  } catch (error: unknown) {
    logger.error('Failed to get form versions', error, logContext);
    return apiErrors.internalError('Failed to retrieve form versions', error, requestId);
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
    
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON in request body', 400, 'VALIDATION_ERROR' as any, requestId);
    }
    
    const { name, type, form } = body as { name?: string; type?: string; form?: unknown };
    
    if (!name || !type || !form) {
      return errorResponse('Missing required fields: name, type, form', 400, 'MISSING_REQUIRED_FIELD' as any, requestId);
    }
    
    if (!['draft', 'version'].includes(type)) {
      return errorResponse('Invalid type. Must be "draft" or "version"', 400, 'VALIDATION_ERROR' as any, requestId);
    }

    // Check for duplicate form name
    const nameExists = await db.checkFormNameExists(storeHash, name);
    if (nameExists) {
      return errorResponse(
        'A form with this name already exists. Please use a different name.',
        409,
        'DUPLICATE_NAME' as any,
        requestId
      );
    }

    const result = await db.saveFormVersion(storeHash, { name, type: type as 'draft' | 'version', form });
    
    logger.info('Form version saved', { ...logContext, storeHash, name, type });
    
    return successResponse({ saved: true, id: result.id }, 200, requestId);
  } catch (error: unknown) {
    logger.error('Failed to save form version', error, logContext);
    return apiErrors.internalError('Failed to save form version', error, requestId);
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
    const { searchParams } = new URL(req.url);
    const versionId = searchParams.get('versionId');
    
    if (!versionId) {
      return errorResponse('Missing versionId', 400, 'MISSING_REQUIRED_FIELD' as any, requestId);
    }
    
    // Get the form version to check if it's active
    const version = await db.getFormVersion(storeHash, versionId);
    if (!version) {
      return errorResponse('Form version not found', 404, 'NOT_FOUND' as any, requestId);
    }
    
    // If the form being deleted is active, we need to deactivate it properly
    const isActive = version.isActive === true;
    
    if (isActive) {
      // Get store settings to check script UUID and active status
      const storeSettings = await db.getStoreSettings(storeHash);
      const scriptUuid = storeSettings?.signupScriptUuid || '';
      const isFormActive = storeSettings?.signupFormActive || false;
      
      // Only proceed with script deletion if form is actually active
      if (isFormActive && scriptUuid && session.accessToken) {
        try {
          // Import BigCommerce client to delete script
          const { bigcommerceClient } = await import('@/lib/auth');
          const bigcommerce = bigcommerceClient(session.accessToken, storeHash);
          
          // Delete the script from BigCommerce
          try {
            await bigcommerce.delete(`/content/scripts/${scriptUuid}`);
            logger.info('Script deleted from BigCommerce', { ...logContext, storeHash, scriptUuid });
          } catch (scriptError: any) {
            // Log but don't fail - script might already be deleted
            const is404 = scriptError?.response?.status === 404 || scriptError?.message?.includes('404');
            if (!is404) {
              logger.warn('Failed to delete script from BigCommerce (non-404 error)', { ...logContext, storeHash, scriptUuid, error: scriptError?.message });
            } else {
              logger.info('Script already deleted from BigCommerce (404)', { ...logContext, storeHash, scriptUuid });
            }
          }
        } catch (authError) {
          logger.warn('Failed to delete script (auth error)', { ...logContext, storeHash, scriptUuid, error: authError });
          // Continue with deletion even if script deletion fails
        }
      } else if (isFormActive && scriptUuid && !session.accessToken) {
        logger.warn('Cannot delete script: missing access token', { ...logContext, storeHash, scriptUuid });
        // Continue with deletion - script will remain in BigCommerce but form will be deactivated
      }
      
      // Deactivate the form (set signupFormActive=false and clear script UUID)
      await db.setStoreFormActive(storeHash, false);
      await db.setStoreScriptUuid(storeHash, '');
      
      // Deactivate all versions to ensure no version is marked as active
      await db.deactivateAllVersions(storeHash);
      
      logger.info('Active form deactivated before deletion', { ...logContext, storeHash, versionId });
    }
    
    // Delete the form version from database
    await db.deleteFormVersion(storeHash, versionId);
    
    // Invalidate cache so GET endpoint returns fresh data
    revalidateTag(`store-settings-${storeHash}`);
    
    logger.info('Form version deleted', { ...logContext, storeHash, versionId, wasActive: isActive });
    
    return successResponse({ deleted: true, wasActive: isActive }, 200, requestId);
  } catch (error: unknown) {
    logger.error('Failed to delete form version', error, logContext);
    return apiErrors.internalError('Failed to delete form version', error, requestId);
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
    
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON in request body', 400, 'VALIDATION_ERROR' as any, requestId);
    }
    
    const { action, versionId, name, form } = body as { action?: string; versionId?: string; name?: string; form?: unknown };
    
    if (action === 'setActive') {
      if (!versionId) {
        return errorResponse('Missing versionId', 400, 'MISSING_REQUIRED_FIELD' as any, requestId);
      }
      await db.setActiveFormVersion(storeHash, versionId);
      // Invalidate cache so GET endpoint returns fresh data
      revalidateTag(`store-settings-${storeHash}`);
      logger.info('Form version set as active', { ...logContext, storeHash, versionId });
      return successResponse({ updated: true, action: 'setActive' }, 200, requestId);
    }
    
    if (action === 'deactivateAll') {
      await db.deactivateAllVersions(storeHash);
      // Invalidate cache so GET endpoint returns fresh data
      revalidateTag(`store-settings-${storeHash}`);
      logger.info('All form versions deactivated', { ...logContext, storeHash });
      return successResponse({ updated: true, action: 'deactivateAll' }, 200, requestId);
    }
    
    if (action === 'update') {
      if (!versionId) {
        return errorResponse('Missing versionId', 400, 'MISSING_REQUIRED_FIELD' as any, requestId);
      }

      // Check for duplicate form name if name is being updated
      if (name) {
        const nameExists = await db.checkFormNameExists(storeHash, name, versionId);
        if (nameExists) {
          return errorResponse(
            'A form with this name already exists. Please use a different name.',
            409,
            'DUPLICATE_NAME' as any,
            requestId
          );
        }
      }

      await db.updateFormVersion(storeHash, versionId, { name, form });
      logger.info('Form version updated', { ...logContext, storeHash, versionId });
      return successResponse({ updated: true, action: 'update' }, 200, requestId);
    }
    
    return errorResponse('Unknown action. Must be "setActive", "deactivateAll", or "update"', 400, 'VALIDATION_ERROR' as any, requestId);
  } catch (error: unknown) {
    logger.error('Failed to update form version', error, logContext);
    return apiErrors.internalError('Failed to update form version', error, requestId);
  }
}

