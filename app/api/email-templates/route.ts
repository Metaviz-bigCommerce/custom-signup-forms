import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { errorResponse, successResponse, apiErrors } from '@/lib/api-response';
import { emailTemplatesSchema } from '@/lib/validation';
import { generateRequestId } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { getCachedEmailTemplates } from '@/lib/cache';

export async function GET(req: NextRequest) {
	const requestId = generateRequestId();
	const logContext = { requestId };
	
	try {
		const session = await getSession(req);
		if (!session) {
			return apiErrors.unauthorized(requestId);
		}
		
		const { storeHash } = session;
		
		// Use cached email templates
		const templates = await getCachedEmailTemplates(storeHash, () => db.getEmailTemplates(storeHash));
		
		return successResponse({ templates }, 200, requestId);
	} catch (error: unknown) {
		logger.error('Failed to get email templates', error, logContext);
		return apiErrors.internalError('Failed to retrieve email templates', error, requestId);
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
			return errorResponse('Invalid JSON in request body', 400, 'VALIDATION_ERROR' as any, requestId);
		}
		
		const { templates } = body as { templates?: unknown };
		if (!templates) {
			return errorResponse('Missing templates', 400, 'MISSING_REQUIRED_FIELD' as any, requestId);
		}
		
		// Validate templates schema
		const validation = emailTemplatesSchema.safeParse(templates);
		if (!validation.success) {
			return errorResponse(
				`Validation error: ${validation.error.issues.map(e => e.message).join(', ')}`,
				400,
				'VALIDATION_ERROR' as any,
				requestId
			);
		}
		
		await db.setEmailTemplates(storeHash, validation.data);
		
		logger.info('Email templates updated', { ...logContext, storeHash });
		
		return successResponse({ updated: true }, 200, requestId);
	} catch (error: unknown) {
		logger.error('Failed to update email templates', error, logContext);
		return apiErrors.internalError('Failed to update email templates', error, requestId);
	}
}


