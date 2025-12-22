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
    } catch (parseError) {
      return errorResponse('Invalid JSON in request body', 400, 'VALIDATION_ERROR' as any, requestId);
    }
    
    const { name, type, form } = body as { name?: string; type?: string; form?: unknown };
    
    if (!name || !type || !form) {
      return errorResponse('Missing required fields: name, type, form', 400, 'MISSING_REQUIRED_FIELD' as any, requestId);
    }
    
    if (!['draft', 'version'].includes(type)) {
      return errorResponse('Invalid type. Must be "draft" or "version"', 400, 'VALIDATION_ERROR' as any, requestId);
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
    
    await db.deleteFormVersion(storeHash, versionId);
    
    logger.info('Form version deleted', { ...logContext, storeHash, versionId });
    
    return successResponse({ deleted: true }, 200, requestId);
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
    } catch (parseError) {
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

