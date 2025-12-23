import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { trySendTemplatedEmail } from '@/lib/email';
import { uploadSignupFile } from '@/lib/storage';
import { applyCorsHeaders, handleCorsPreflight } from '@/lib/middleware/cors';
import { errorResponse, successResponse, apiErrors, ErrorCode } from '@/lib/api-response';
import { signupRequestBodySchema, signupRequestDataSchema, publicIdSchema, validateFile } from '@/lib/validation';
import { extractName } from '@/lib/utils';
import { generateRequestId } from '@/lib/utils';
import { logger } from '@/lib/logger';

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
        if ((createError as { code?: string })?.code === 'DUPLICATE') {
          const res = apiErrors.duplicate(
            'You have already submitted a request. Please wait for approval or contact the store admin.',
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
      
      // Send signup confirmation email (best-effort, don't fail request)
      try {
        const templates = await db.getEmailTemplates(storeHash);
        const config = await db.getEmailConfig(storeHash);
        const name = extractName(data);
        const platformName = process.env.PLATFORM_NAME || storeHash || 'Store';
        
        await trySendTemplatedEmail({
          to: email || null,
          template: templates.signup,
          vars: {
            name,
            email: email || '',
            date: new Date().toLocaleString(),
            store_name: platformName,
            platform_name: platformName,
          },
          replyTo: config?.replyTo || undefined,
          config,
          templateKey: 'signup',
        });
      } catch (emailError) {
        logger.error('Failed to send signup confirmation email', emailError, { ...logContext, email });
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
        if ((createError as { code?: string })?.code === 'DUPLICATE') {
          const res = apiErrors.duplicate(
            'You have already submitted a request. Please wait for approval or contact the store admin.',
            requestId
          );
          return applyCorsHeaders(req, res);
        }
        throw createError;
      }
      
      // Send signup confirmation email (best-effort)
      try {
        const templates = await db.getEmailTemplates(storeHash);
        const config = await db.getEmailConfig(storeHash);
        const name = extractName(data);
        const platformName = process.env.PLATFORM_NAME || storeHash || 'Store';
        
        await trySendTemplatedEmail({
          to: email || null,
          template: templates.signup,
          vars: {
            name,
            email: email || '',
            date: new Date().toLocaleString(),
            store_name: platformName,
            platform_name: platformName,
          },
          replyTo: config?.replyTo || undefined,
          config,
          templateKey: 'signup',
        });
      } catch (emailError) {
        logger.error('Failed to send signup confirmation email', emailError, { ...logContext, email });
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
