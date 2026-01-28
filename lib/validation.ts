/**
 * Input validation schemas using Zod
 */

import { z } from 'zod';

// File upload constraints
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
] as const;

// Common validation schemas
export const emailSchema = z.string().email().toLowerCase().max(255);
export const publicIdSchema = z.string().min(1).max(100).trim();
export const requestIdSchema = z.string().min(1).max(200);

// Signup request data schema
export const signupRequestDataSchema = z.record(z.string(), z.unknown()).refine(
  (data) => Object.keys(data).length <= 100,
  'Too many fields in request data'
);

// Signup request body schema (JSON)
export const signupRequestBodySchema = z.object({
  pub: publicIdSchema.optional(),
  data: signupRequestDataSchema,
  email: emailSchema.optional().nullable(),
  idempotency_key: z.string().max(200).optional(),
}).passthrough();

// Signup request form data schema (multipart)
export const signupRequestFormDataSchema = z.object({
  pub: publicIdSchema,
  data: z.string().transform((str) => {
    try {
      return JSON.parse(str || '{}');
    } catch {
      return {};
    }
  }).pipe(signupRequestDataSchema),
  email: z.string().email().toLowerCase().max(255).optional().nullable(),
  idempotency_key: z.string().max(200).optional(),
});

// File validation schema
export const fileSchema = z.object({
  name: z.string().min(1).max(255),
  size: z.number().max(MAX_FILE_SIZE),
  type: z.string().refine(
    (type) => ALLOWED_FILE_TYPES.includes(type as typeof ALLOWED_FILE_TYPES[number]),
    `File type not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`
  ),
});

// Store form schema
export const formFieldSchema = z.object({
  id: z.number(),
  type: z.enum(['text', 'email', 'phone', 'number', 'textarea', 'select', 'radio', 'checkbox', 'date', 'file', 'url']),
  label: z.string(),
  placeholder: z.string().optional(),
  required: z.boolean(),
  labelColor: z.string().max(20),
  labelSize: z.string().max(10).refine((val) => {
    const num = parseInt(val);
    return !isNaN(num) && num >= 10 && num <= 24;
  }, { message: 'Label size must be between 10 and 24px' }),
  labelWeight: z.string().max(10),
  borderColor: z.string().max(20),
  borderWidth: z.string().max(10),
  borderRadius: z.string().max(10),
  bgColor: z.string().max(20),
  padding: z.string().max(10),
  fontSize: z.string().max(10),
  textColor: z.string().max(20),
  role: z.enum(['first_name', 'last_name', 'email', 'password', 'country', 'state']).optional(),
  locked: z.boolean().optional(),
  options: z.array(z.object({
    label: z.string(),
    value: z.string().max(200),
  })).optional(),
  rowGroup: z.number().nullable().optional(),
}).superRefine((data, ctx) => {
  // Label validation: 50 chars for non-checkbox, 250 for checkbox
  if (data.type === 'checkbox') {
    if (data.label.length > 250) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Checkbox label must be 250 characters or less',
        path: ['label'],
      });
    }
    // Allow empty string for checkbox labels
    if (data.label.length === 0) {
      // If label is empty, at least one option is required
      if (!data.options || data.options.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Checkbox fields without a label must have at least one option',
          path: ['options'],
        });
      }
    }
    // Validate checkbox option labels (250 chars max)
    if (data.options) {
      data.options.forEach((opt, index) => {
        if (opt.label.length > 250) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Checkbox option label must be 250 characters or less',
            path: ['options', index, 'label'],
          });
        }
      });
    }
  } else {
    // For all other fields, require at least 1 character and max 50
    if (data.label.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Label must have at least 1 character',
        path: ['label'],
      });
    }
    if (data.label.length > 50) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Label must be 50 characters or less',
        path: ['label'],
      });
    }
    // Validate placeholder (50 chars max for non-checkbox fields)
    if (data.placeholder && data.placeholder.length > 50) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Placeholder must be 50 characters or less',
        path: ['placeholder'],
      });
    }
    // Validate option labels for select/radio (200 chars max, but we'll keep existing limit)
    if (data.options) {
      data.options.forEach((opt, index) => {
        if (opt.label.length > 200) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Option label must be 200 characters or less',
            path: ['options', index, 'label'],
          });
        }
      });
    }
  }
});

export const formThemeSchema = z.object({
  title: z.string().max(200),
  subtitle: z.string().max(500).optional(),
  // Typography properties
  titleColor: z.string().max(20).optional(),
  titleFontSize: z.number().min(10).max(100).optional(),
  titleFontWeight: z.string().max(10).optional(),
  subtitleColor: z.string().max(20).optional(),
  subtitleFontSize: z.number().min(8).max(50).optional(),
  subtitleFontWeight: z.string().max(10).optional(),
  // Branding properties
  primaryColor: z.string().max(20),
  layout: z.enum(['split', 'center']),
  splitImageUrl: z.string().max(2000).refine(
    (val) => val === '' || z.string().url().safeParse(val).success,
    { message: 'Invalid URL' }
  ).optional(),
  // Button properties
  buttonText: z.string().max(100),
  buttonBg: z.string().max(20),
  buttonColor: z.string().max(20),
  buttonRadius: z.number().min(0).max(50),
  // Background properties
  formBackgroundColor: z.string().max(20).optional(),
  pageBackgroundColor: z.string().max(20).optional(),
}).passthrough(); // Allow additional properties to pass through

export const storeFormSchema = z.object({
  fields: z.array(formFieldSchema).max(100),
  theme: formThemeSchema,
});

// Email template design schema
export const emailTemplateDesignSchema = z.object({
  logoUrl: z.string().url().max(500).optional().nullable(),
  bannerUrl: z.string().url().max(500).optional().nullable(),
  primaryColor: z.string().max(20).optional().nullable(),
  background: z.string().max(20).optional().nullable(),
  title: z.string().max(200).optional().nullable(),
  greeting: z.string().max(200).optional().nullable(),
  ctas: z.array(z.object({
    id: z.string(),
    text: z.string().max(100),
    url: z.string().max(500),
  })).optional().nullable(),
  footerNote: z.string().max(500).optional().nullable(),
  footerLinks: z.array(z.object({
    id: z.string(),
    text: z.string().max(100),
    url: z.string().max(500),
  })).optional().nullable(),
  socialLinks: z.array(z.object({
    id: z.string(),
    name: z.string().max(100),
    url: z.string().max(500),
    iconUrl: z.string().url().max(500),
  })).optional().nullable(),
}).optional().nullable();

// Email template schema
export const emailTemplateSchema = z.object({
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(10000),
  html: z.string().max(50000).optional().nullable(),
  useHtml: z.boolean().optional().nullable(),
  design: emailTemplateDesignSchema,
});

export const emailTemplatesSchema = z.object({
  signup: emailTemplateSchema,
  approval: emailTemplateSchema,
  rejection: emailTemplateSchema,
  moreInfo: emailTemplateSchema,
  resubmissionConfirmation: emailTemplateSchema,
});

// Email config schema
export const emailSmtpConfigSchema = z.object({
  host: z.string().min(1).max(255),
  port: z.number().min(1).max(65535),
  user: z.string().min(1).max(255),
  pass: z.string().min(1).max(500),
  secure: z.boolean().optional(),
});

export const emailConfigSchema = z.object({
  fromEmail: z.string().email().max(255).optional().nullable(),
  fromName: z.string().max(100).optional().nullable(),
  replyTo: z.string().email().max(255).optional().nullable(),
  useShared: z.boolean().optional().nullable(),
  smtp: emailSmtpConfigSchema.optional().nullable(),
});

// Signup request status update schema
export const signupRequestStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
});

// Info request schema
export const infoRequestSchema = z.object({
  required_information: z.string().min(1).max(2000),
});

// Resubmission request schema
export const resubmissionRequestSchema = z.object({
  problematicFields: z.array(z.string().min(1)).min(1).max(100),
  message: z.string().max(2000).optional(),
});

// Cooldown period schema
export const cooldownPeriodSchema = z.number().int().min(1).max(365);

// Cooldown config schema
export const cooldownConfigSchema = z.object({
  days: cooldownPeriodSchema,
});

// Reset cooldown schema
export const resetCooldownSchema = z.object({
  email: emailSchema,
});

// Validation helper functions
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` };
  }
  
  if (!ALLOWED_FILE_TYPES.includes(file.type as typeof ALLOWED_FILE_TYPES[number])) {
    return { valid: false, error: `File type ${file.type} is not allowed` };
  }
  
  return { valid: true };
}

/**
 * Safe JSON parse with validation
 */
export function safeJsonParse<T>(str: string, schema: z.ZodSchema<T>): { success: true; data: T } | { success: false; error: string } {
  try {
    const parsed = JSON.parse(str);
    const result = schema.safeParse(parsed);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error.issues.map((e) => e.message).join(', ') };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Invalid JSON' };
  }
}

