import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { trySendTemplatedEmail } from '@/lib/email';
import { errorResponse, successResponse, apiErrors } from '@/lib/api-response';
import { infoRequestSchema, requestIdSchema } from '@/lib/validation';
import { extractName } from '@/lib/utils';
import { generateRequestId } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';

export async function POST(req: NextRequest) {
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
			return errorResponse('Invalid request ID', 400, 'VALIDATION_ERROR' as any, requestId);
		}
		
		const id = idValidation.data;
		
		// Parse and validate request body
		let body: unknown;
		try {
			body = await req.json();
		} catch (parseError) {
			return errorResponse('Invalid JSON in request body', 400, 'VALIDATION_ERROR' as any, requestId);
		}
		
		const validation = infoRequestSchema.safeParse(body);
		if (!validation.success) {
			return errorResponse(
				`Validation error: ${validation.error.errors.map(e => e.message).join(', ')}`,
				400,
				'VALIDATION_ERROR' as any,
				requestId
			);
		}
		
		const { required_information } = validation.data;
		
		// Get signup request
		const request = await db.getSignupRequest(storeHash, id);
		if (!request) {
			return apiErrors.notFound('Signup request', requestId);
		}
		
		// Get email templates and config
		const templates = await db.getEmailTemplates(storeHash);
		const config = await db.getEmailConfig(storeHash);
		const name = extractName(request.data || {});
		const email = request.email || null;
		const platformName = env.PLATFORM_NAME || storeHash || 'Store';
		
		// Send email (best-effort)
		if (email) {
			try {
				await trySendTemplatedEmail({
					to: email,
					template: templates.moreInfo,
					vars: {
						name,
						email: email || '',
						date: new Date().toLocaleString(),
						store_name: platformName,
						platform_name: platformName,
						required_information: required_information || '',
					},
					replyTo: config?.replyTo || undefined,
					config,
					templateKey: 'moreInfo',
				});
				
				logger.info('Info request email sent', { ...logContext, storeHash, requestId: id, email });
			} catch (emailError) {
				logger.error('Failed to send info request email', emailError, { ...logContext, storeHash, requestId: id, email });
				// Don't fail the request if email fails
			}
		} else {
			logger.warn('Cannot send info request email: no email address', { ...logContext, storeHash, requestId: id });
		}
		
		return successResponse({ sent: true }, 200, requestId);
	} catch (error: unknown) {
		logger.error('Failed to send info request', error, logContext);
		return apiErrors.internalError('Failed to send info request', error, requestId);
	}
}


