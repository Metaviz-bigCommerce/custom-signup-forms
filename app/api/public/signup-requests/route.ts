import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { trySendTemplatedEmail, sendOwnerNotification } from '@/lib/email';
import { uploadSignupFile, deleteSignupRequestFiles } from '@/lib/storage';
import { applyCorsHeaders, handleCorsPreflight } from '@/lib/middleware/cors';
import { errorResponse, successResponse, apiErrors, ErrorCode } from '@/lib/api-response';
import { signupRequestBodySchema, signupRequestDataSchema, publicIdSchema, validateFile } from '@/lib/validation';
import { extractName } from '@/lib/utils';
import { generateRequestId } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req);
}

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  const logContext = { requestId };
  
  try {
    const ct = req.headers.get('content-type') || '';
    const idempotencyKey = req.headers.get('idempotency-key') || undefined;
    
    if (ct.includes('multipart/form-data')) {
      // Handle multipart form data (with file uploads)
      const form = await req.formData();
      
      // Validate public ID
      const publicIdRaw = form.get('pub');
      if (!publicIdRaw || typeof publicIdRaw !== 'string') {
        const res = errorResponse('Missing store identifier', 400, ErrorCode.MISSING_REQUIRED_FIELD, requestId);
        return applyCorsHeaders(req, res);
      }
      
      const publicId = publicIdRaw.trim();
      const publicIdValidation = publicIdSchema.safeParse(publicId);
      if (!publicIdValidation.success) {
        const res = errorResponse('Invalid store identifier', 400, ErrorCode.VALIDATION_ERROR, requestId);
        return applyCorsHeaders(req, res);
      }
      
      // Resolve store hash
      const storeHash = await db.resolveStoreHashByPublicId(publicId);
      if (!storeHash) {
        const res = apiErrors.notFound('Store', requestId);
        return applyCorsHeaders(req, res);
      }
      
      // Validate and parse form data
      const dataStr = String(form.get('data') || '{}');
      const emailRaw = form.get('email');
      const email = emailRaw && typeof emailRaw === 'string' ? emailRaw.toLowerCase().trim() : null;
      
      // Parse and validate JSON data
      let data: Record<string, unknown> = {};
      try {
        const parsed = JSON.parse(dataStr);
        const validation = signupRequestDataSchema.safeParse(parsed);
        if (!validation.success) {
          const res = errorResponse(
            `Invalid form data: ${validation.error.issues.map((e) => e.message).join(', ')}`,
            400,
            ErrorCode.VALIDATION_ERROR,
            requestId
          );
          return applyCorsHeaders(req, res);
        }
        data = validation.data;
      } catch (parseError) {
        const res = errorResponse('Invalid JSON in form data', 400, ErrorCode.VALIDATION_ERROR, requestId);
        return applyCorsHeaders(req, res);
      }
      
      // Validate email if provided
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        const res = errorResponse('Invalid email format', 400, ErrorCode.VALIDATION_ERROR, requestId);
        return applyCorsHeaders(req, res);
      }
      
      // Get metadata
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
      const origin = req.headers.get('origin') || null;
      const userAgent = req.headers.get('user-agent') || null;
      
      // Validate files first (before creating request)
      const fileEntries: Array<{ key: string; file: File; buffer: Buffer }> = [];
      const fileErrors: string[] = [];
      
      for (const [key, value] of form.entries()) {
        if (key.startsWith('file__') && value && typeof value !== 'string') {
          const file = value as File;
          
          // Validate file
          const fileValidation = validateFile(file);
          if (!fileValidation.valid) {
            fileErrors.push(`${file.name}: ${fileValidation.error}`);
            continue;
          }
          
          // Read file into buffer
          try {
            const ab = await file.arrayBuffer();
            const buf = Buffer.from(ab);
            fileEntries.push({ key, file, buffer: buf });
          } catch (readError) {
            logger.error('Failed to read file', readError, { ...logContext, fileName: file.name });
            fileErrors.push(`${file.name}: Failed to read file`);
          }
        }
      }
      
      if (fileErrors.length > 0) {
        const res = errorResponse(
          `File validation errors: ${fileErrors.join('; ')}`,
          400,
          ErrorCode.VALIDATION_ERROR,
          requestId
        );
        return applyCorsHeaders(req, res);
      }
      
      // Check for resubmission_requested request and delete it if found
      let wasResubmission = false;
      if (email) {
        try {
          const resubmissionRequest = await (db as any).findResubmissionRequestedRequest(storeHash, email);
          if (resubmissionRequest) {
            wasResubmission = true;
            // Delete files from storage
            if (resubmissionRequest.files && resubmissionRequest.files.length > 0) {
              try {
                await deleteSignupRequestFiles(resubmissionRequest.files);
              } catch (fileDeleteError) {
                logger.error('Failed to delete files from resubmission request', fileDeleteError, { ...logContext, requestId: resubmissionRequest.id });
                // Continue even if file deletion fails
              }
            }
            // Delete the resubmission request
            await db.deleteSignupRequest(storeHash, resubmissionRequest.id);
            logger.info('Deleted resubmission_requested request', { ...logContext, deletedRequestId: resubmissionRequest.id, email });
          }
        } catch (resubmissionCheckError) {
          logger.error('Error checking for resubmission request', resubmissionCheckError, { ...logContext, email });
          // Continue with normal flow if check fails
        }
      }
      
      // Create signup request first
      let created;
      try {
        created = await db.createSignupRequest(storeHash, {
          data,
          email: email || null,
          ip,
          origin,
          userAgent,
          idempotencyKey,
        });
      } catch (createError: unknown) {
        const error = createError as { code?: string; remainingDays?: number; message?: string };
        if (error.code === 'ACCOUNT_EXISTS') {
          const res = errorResponse(
            'An account with this email already exists. Please login instead.',
            409,
            ErrorCode.CONFLICT,
            requestId
          );
          return applyCorsHeaders(req, res);
        }
        if (error.code === 'DUPLICATE') {
          const res = apiErrors.duplicate(
            'You have already submitted a request. Please wait for approval or contact the store admin.',
            requestId
          );
          return applyCorsHeaders(req, res);
        }
        if (error.code === 'COOLDOWN_ACTIVE') {
          const remainingDays = error.remainingDays ?? 7;
          const res = errorResponse(
            `You've recently submitted a request. Please wait ${remainingDays} ${remainingDays === 1 ? 'day' : 'days'} before trying again.`,
            429,
            ErrorCode.RATE_LIMIT_EXCEEDED,
            requestId
          );
          return applyCorsHeaders(req, res);
        }
        throw createError;
      }
      
      // Upload files after request creation (with actual request ID)
      const filesMeta: Array<{ name: string; url: string; contentType?: string; size?: number; path?: string }> = [];
      const uploadErrors: string[] = [];
      
      for (const { file, buffer } of fileEntries) {
        try {
          const meta = await uploadSignupFile(
            publicId,
            created.id,
            file.name,
            file.type || 'application/octet-stream',
            buffer
          );
          filesMeta.push(meta);
        } catch (uploadError) {
          logger.error('File upload failed', uploadError, { ...logContext, fileName: file.name, requestId: created.id });
          uploadErrors.push(`${file.name}: Upload failed`);
        }
      }
      
      // Add files to request (even if some failed, add the successful ones)
      if (filesMeta.length > 0) {
        try {
          await db.addSignupRequestFiles(storeHash, created.id, filesMeta);
        } catch (addFilesError) {
          logger.error('Failed to add files metadata to request', addFilesError, { ...logContext, requestId: created.id });
          // Don't fail the request if file metadata addition fails
        }
      }
      
      // Log upload errors but don't fail the request
      if (uploadErrors.length > 0) {
        logger.warn('Some files failed to upload', { ...logContext, errors: uploadErrors, requestId: created.id });
      }
      
      // Send emails (best-effort, don't fail request)
      try {
        const templates = await db.getEmailTemplates(storeHash);
        const config = await db.getEmailConfig(storeHash);
        const name = extractName(data);
        const platformName = env.PLATFORM_NAME || storeHash || 'Store';
        
        // Send confirmation email to user
        if (email) {
          try {
            // Use resubmissionConfirmation template if this is a resubmission, otherwise use signup template
            const templateToUse = wasResubmission ? templates.resubmissionConfirmation : templates.signup;
            const templateKey = wasResubmission ? 'resubmissionConfirmation' : 'signup';

            const emailResult = await trySendTemplatedEmail({
              to: email,
              template: templateToUse,
              vars: {
                name,
                email: email || '',
                date: new Date().toLocaleString(),
                store_name: platformName,
                platform_name: platformName,
              },
              replyTo: config?.replyTo || undefined,
              config,
              templateKey,
              isCustomerEmail: true, // Customer emails require store owner SMTP
            });
            if (!emailResult.ok && emailResult.skipped) {
              logger.warn('Signup confirmation email skipped', { ...logContext, email, reason: emailResult.reason || 'Unknown reason' });
            }
          } catch (emailError) {
            logger.error('Failed to send signup confirmation email', emailError, { ...logContext, email });
          }
        }

        // Send notification email to store owner
        try {
          const ownerEmail = await db.getStoreOwnerEmail(storeHash);
          if (ownerEmail) {
            const notificationTemplateKey = wasResubmission ? 'ownerResubmission' : 'ownerNewSignup';
            // Construct dashboard URL for the CTA button
            const baseUrl = env.BASE_URL || env.API_URL || 'https://your-app-domain.com';
            const dashboardUrl = `${baseUrl}/requests?storeHash=${storeHash}`;

            await sendOwnerNotification({
              ownerEmail,
              templateKey: notificationTemplateKey,
              vars: {
                name,
                email: email || 'No email provided',
                date: new Date().toLocaleString(),
                store_name: platformName,
                platform_name: platformName,
                request_id: created.id,
                dashboard_url: dashboardUrl,
              },
              config,
            });
            logger.info('Sent owner notification email', {
              ...logContext,
              ownerEmail,
              requestId: created.id,
              wasResubmission
            });
          }
        } catch (notificationError) {
          logger.error('Failed to send owner notification email', notificationError, { ...logContext });
          // Don't fail the request if notification fails
        }

        if (wasResubmission) {
          logger.info('User resubmitted request', { ...logContext, requestId: created.id, email });
        }
      } catch (emailError) {
        logger.error('Failed to send emails', emailError, { ...logContext, email });
        // Don't fail the request if email fails
      }
      
      const res = successResponse(
        { id: created.id, files: filesMeta },
        200,
        requestId
      );
      return applyCorsHeaders(req, res);
      
    } else {
      // Handle JSON request
      let body: unknown;
      try {
        body = await req.json();
      } catch (parseError) {
        const res = errorResponse('Invalid JSON in request body', 400, ErrorCode.VALIDATION_ERROR, requestId);
        return applyCorsHeaders(req, res);
      }
      
      // Validate request body
      const validation = signupRequestBodySchema.safeParse(body);
      if (!validation.success) {
        const res = errorResponse(
          `Validation error: ${validation.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
          400,
          ErrorCode.VALIDATION_ERROR,
          requestId
        );
        return applyCorsHeaders(req, res);
      }
      
      const { pub, data, email, idempotency_key } = validation.data;
      const publicId = pub || req.nextUrl.searchParams.get('pub')?.trim();
      
      if (!publicId) {
        const res = errorResponse('Missing store identifier', 400, ErrorCode.MISSING_REQUIRED_FIELD, requestId);
        return applyCorsHeaders(req, res);
      }
      
      // Resolve store hash
      const storeHash = await db.resolveStoreHashByPublicId(publicId);
      if (!storeHash) {
        const res = apiErrors.notFound('Store', requestId);
        return applyCorsHeaders(req, res);
      }
      
      // Get metadata
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
      const origin = req.headers.get('origin') || null;
      const userAgent = req.headers.get('user-agent') || null;
      
      // Check for resubmission_requested request and delete it if found
      let wasResubmission = false;
      const emailLower = email ? email.toLowerCase().trim() : null;
      if (emailLower) {
        try {
          const resubmissionRequest = await (db as any).findResubmissionRequestedRequest(storeHash, emailLower);
          if (resubmissionRequest) {
            wasResubmission = true;
            // Delete files from storage
            if (resubmissionRequest.files && resubmissionRequest.files.length > 0) {
              try {
                await deleteSignupRequestFiles(resubmissionRequest.files);
              } catch (fileDeleteError) {
                logger.error('Failed to delete files from resubmission request', fileDeleteError, { ...logContext, requestId: resubmissionRequest.id });
                // Continue even if file deletion fails
              }
            }
            // Delete the resubmission request
            await db.deleteSignupRequest(storeHash, resubmissionRequest.id);
            logger.info('Deleted resubmission_requested request', { ...logContext, deletedRequestId: resubmissionRequest.id, email: emailLower });
          }
        } catch (resubmissionCheckError) {
          logger.error('Error checking for resubmission request', resubmissionCheckError, { ...logContext, email: emailLower });
          // Continue with normal flow if check fails
        }
      }
      
      // Create signup request
      let created;
      try {
        created = await db.createSignupRequest(storeHash, {
          data,
          email: email || null,
          ip,
          origin,
          userAgent,
          idempotencyKey: idempotency_key || idempotencyKey,
        });
      } catch (createError: unknown) {
        const error = createError as { code?: string; remainingDays?: number; message?: string };
        if (error.code === 'ACCOUNT_EXISTS') {
          const res = errorResponse(
            'An account with this email already exists. Please login instead.',
            409,
            ErrorCode.CONFLICT,
            requestId
          );
          return applyCorsHeaders(req, res);
        }
        if (error.code === 'DUPLICATE') {
          const res = apiErrors.duplicate(
            'You have already submitted a request. Please wait for approval or contact the store admin.',
            requestId
          );
          return applyCorsHeaders(req, res);
        }
        if (error.code === 'COOLDOWN_ACTIVE') {
          const remainingDays = error.remainingDays ?? 7;
          const res = errorResponse(
            `You've recently submitted a request. Please wait ${remainingDays} ${remainingDays === 1 ? 'day' : 'days'} before trying again.`,
            429,
            ErrorCode.RATE_LIMIT_EXCEEDED,
            requestId
          );
          return applyCorsHeaders(req, res);
        }
        throw createError;
      }
      
      // Send emails (best-effort, don't fail request)
      try {
        const templates = await db.getEmailTemplates(storeHash);
        const config = await db.getEmailConfig(storeHash);
        const name = extractName(data);
        const platformName = env.PLATFORM_NAME || storeHash || 'Store';
        
        // Send confirmation email to user
        if (email) {
          try {
            // Use resubmissionConfirmation template if this is a resubmission, otherwise use signup template
            const templateToUse = wasResubmission ? templates.resubmissionConfirmation : templates.signup;
            const templateKey = wasResubmission ? 'resubmissionConfirmation' : 'signup';

            const emailResult = await trySendTemplatedEmail({
              to: email,
              template: templateToUse,
              vars: {
                name,
                email: email || '',
                date: new Date().toLocaleString(),
                store_name: platformName,
                platform_name: platformName,
              },
              replyTo: config?.replyTo || undefined,
              config,
              templateKey,
              isCustomerEmail: true, // Customer emails require store owner SMTP
            });
            if (!emailResult.ok && emailResult.skipped) {
              logger.warn('Signup confirmation email skipped', { ...logContext, email, reason: emailResult.reason || 'Unknown reason' });
            }
          } catch (emailError) {
            logger.error('Failed to send signup confirmation email', emailError, { ...logContext, email });
          }
        }

        // Send notification email to store owner
        try {
          const ownerEmail = await db.getStoreOwnerEmail(storeHash);
          if (ownerEmail) {
            const notificationTemplateKey = wasResubmission ? 'ownerResubmission' : 'ownerNewSignup';
            // Construct dashboard URL for the CTA button
            const baseUrl = env.BASE_URL || env.API_URL || 'https://your-app-domain.com';
            const dashboardUrl = `${baseUrl}/requests?storeHash=${storeHash}`;

            await sendOwnerNotification({
              ownerEmail,
              templateKey: notificationTemplateKey,
              vars: {
                name,
                email: email || 'No email provided',
                date: new Date().toLocaleString(),
                store_name: platformName,
                platform_name: platformName,
                request_id: created.id,
                dashboard_url: dashboardUrl,
              },
              config,
            });
            logger.info('Sent owner notification email', {
              ...logContext,
              ownerEmail,
              requestId: created.id,
              wasResubmission
            });
          }
        } catch (notificationError) {
          logger.error('Failed to send owner notification email', notificationError, { ...logContext });
          // Don't fail the request if notification fails
        }

        if (wasResubmission) {
          logger.info('User resubmitted request', { ...logContext, requestId: created.id, email });
        }
      } catch (emailError) {
        logger.error('Failed to send emails', emailError, { ...logContext, email });
        // Don't fail the request if email fails
      }
      
      const res = successResponse(
        { id: created.id },
        200,
        requestId
      );
      return applyCorsHeaders(req, res);
    }
  } catch (error: unknown) {
    logger.error('Unexpected error in signup request', error, logContext);
    const res = apiErrors.internalError(
      'An unexpected error occurred. Please try again later.',
      error,
      requestId
    );
    return applyCorsHeaders(req, res);
  }
}
