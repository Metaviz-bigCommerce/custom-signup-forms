import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { applyCorsHeaders, handleCorsPreflight } from '@/lib/middleware/cors';
import { errorResponse, successResponse, apiErrors, ErrorCode } from '@/lib/api-response';
import { publicIdSchema } from '@/lib/validation';
import { generateRequestId } from '@/lib/utils';
import { logger } from '@/lib/logger';

/**
 * Fetch country data from CDN (same source as generate-signup-script)
 */
async function fetchCountryData(): Promise<Array<{ countryName: string; countryShortCode: string; regions: Array<{ name: string; shortCode?: string }> }>> {
  try {
    const res = await fetch('https://cdn.jsdelivr.net/npm/country-region-data@3.0.0/data.json');
    const json = await res.json();
    if (Array.isArray(json)) {
      return json;
    }
  } catch (error) {
    logger.error('Failed to fetch country data', error);
  }
  // Fallback to minimal data if fetch fails
  return [
    { countryName: 'United States', countryShortCode: 'US', regions: [{ name: 'California', shortCode: 'CA' }, { name: 'New York', shortCode: 'NY' }] },
    { countryName: 'Canada', countryShortCode: 'CA', regions: [{ name: 'Ontario', shortCode: 'ON' }, { name: 'Quebec', shortCode: 'QC' }] },
    { countryName: 'United Kingdom', countryShortCode: 'GB', regions: [{ name: 'England' }, { name: 'Scotland' }, { name: 'Wales' }, { name: 'Northern Ireland' }] },
    { countryName: 'Australia', countryShortCode: 'AU', regions: [{ name: 'New South Wales', shortCode: 'NSW' }, { name: 'Victoria', shortCode: 'VIC' }] },
    { countryName: 'India', countryShortCode: 'IN', regions: [{ name: 'Maharashtra' }, { name: 'Karnataka' }] },
    { countryName: 'Pakistan', countryShortCode: 'PK', regions: [{ name: 'Punjab' }, { name: 'Sindh' }] },
  ];
}

export async function OPTIONS(req: NextRequest) {
  // Allow all origins for public endpoint
  return handleCorsPreflight(req, true);
}

export async function GET(req: NextRequest) {
  const requestId = generateRequestId();
  const logContext = { requestId };
  
  try {
    // Get pub parameter from query string
    const publicIdRaw = req.nextUrl.searchParams.get('pub');
    
    if (!publicIdRaw) {
      const res = errorResponse('Missing store identifier (pub parameter)', 400, ErrorCode.MISSING_REQUIRED_FIELD, requestId);
      return applyCorsHeaders(req, res, true);
    }
    
    const publicId = publicIdRaw.trim();
    const publicIdValidation = publicIdSchema.safeParse(publicId);
    if (!publicIdValidation.success) {
      const res = errorResponse('Invalid store identifier', 400, ErrorCode.VALIDATION_ERROR, requestId);
      return applyCorsHeaders(req, res, true);
    }
    
    // Resolve store hash
    const storeHash = await db.resolveStoreHashByPublicId(publicId);
    if (!storeHash) {
      const res = apiErrors.notFound('Store', requestId);
      return applyCorsHeaders(req, res, true);
    }
    
    // Get store settings to check if form is active
    const settings = await db.getStoreSettings(storeHash);
    if (!settings) {
      const res = apiErrors.notFound('Store', requestId);
      return applyCorsHeaders(req, res, true);
    }
    
    // Check if form is active
    if (!settings.signupFormActive || !settings.signupForm) {
      const res = apiErrors.notFound('Active form', requestId);
      return applyCorsHeaders(req, res, true);
    }
    
    // Extract form data - return the complete form object to ensure all properties are included
    const form = settings.signupForm;
    
    if (!form) {
      const res = apiErrors.notFound('Form configuration', requestId);
      return applyCorsHeaders(req, res, true);
    }
    
    // Log the form structure for debugging
    logger.info('Form config requested', { 
      ...logContext, 
      storeHash, 
      hasFields: !!form.fields, 
      fieldsCount: form.fields?.length || 0,
      hasTheme: !!form.theme,
      themeType: typeof form.theme,
      themeIsObject: form.theme && typeof form.theme === 'object',
      themeKeys: form.theme && typeof form.theme === 'object' ? Object.keys(form.theme) : [],
      formKeys: Object.keys(form),
      formBackgroundColor: form.theme?.formBackgroundColor,
      fullForm: JSON.stringify(form).substring(0, 500)
    });
    
    // Ensure we have the required properties with defaults
    const fields = form.fields || [];
    // Ensure theme is always an object - if form.theme is missing or null, use empty object
    // This prevents issues where theme might be undefined
    const theme = (form.theme && typeof form.theme === 'object' && !Array.isArray(form.theme)) ? form.theme : {};
    
    // Fetch country data
    const countryData = await fetchCountryData();
    
    // Return form configuration - explicitly structure the response to ensure theme is always included
    const config = {
      fields, // Explicitly set to ensure it's always an array
      theme: {
        // Spread theme properties to ensure all theme configs are included
        // This ensures properties like titleColor, titleFontSize, titleFontWeight,
        // subtitleColor, subtitleFontSize, subtitleFontWeight, pageBackgroundColor, formBackgroundColor, etc. are all included
        ...theme,
      },
      containerId: form.containerId || 'custom-signup-container', // Use form's containerId if available
      countryData, // Add country data
    };
    
    // Log the final config structure for debugging
    logger.info('Form config prepared', { 
      ...logContext, 
      fieldsCount: config.fields?.length || 0,
      themeKeys: config.theme ? Object.keys(config.theme) : [],
      themeFormBackgroundColor: config.theme?.formBackgroundColor,
      configKeys: Object.keys(config),
      fullConfig: JSON.stringify(config).substring(0, 500)
    });
    
    const res = successResponse(config, 200, requestId);
    return applyCorsHeaders(req, res, true);
    
  } catch (error: unknown) {
    logger.error('Unexpected error in form-config', error, logContext);
    const res = apiErrors.internalError(
      'An unexpected error occurred. Please try again later.',
      error,
      requestId
    );
    return applyCorsHeaders(req, res, true);
  }
}

