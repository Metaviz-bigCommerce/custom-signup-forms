/**
 * Environment variable validation and type-safe access
 * Validates environment variables when accessed, not at module load time
 * This allows the app to start even if some optional vars are missing
 */

const requiredEnvVars = [
  'FIRE_API_KEY',
  'FIRE_PROJECT_ID',
  'CLIENT_ID',
  'CLIENT_SECRET',
  'JWT_KEY',
] as const;

const optionalEnvVars = [
  'FIRE_DOMAIN',
  'AUTH_CALLBACK',
  'BASE_URL',
  'API_URL',
  'LOGIN_URL',
  'PLATFORM_NAME',
  'ALLOWED_ORIGINS',
  'EMAIL_FROM',
  'EMAIL_FROM_NAME',
  'EMAIL_REPLY_TO',
  'BREVO_SMTP_HOST',
  'BREVO_SMTP_PORT',
  'BREVO_SMTP_USER',
  'BREVO_SMTP_KEY',
  'BREVO_SMTP_PASS',
  'NODE_ENV',
] as const;

interface EnvConfig {
  // Required
  FIRE_API_KEY: string;
  FIRE_PROJECT_ID: string;
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  JWT_KEY: string;
  
  // Optional
  FIRE_DOMAIN?: string;
  AUTH_CALLBACK?: string;
  BASE_URL?: string;
  API_URL?: string;
  LOGIN_URL?: string;
  PLATFORM_NAME?: string;
  ALLOWED_ORIGINS?: string;
  EMAIL_FROM?: string;
  EMAIL_FROM_NAME?: string;
  EMAIL_REPLY_TO?: string;
  BREVO_SMTP_HOST?: string;
  BREVO_SMTP_PORT?: string;
  BREVO_SMTP_USER?: string;
  BREVO_SMTP_KEY?: string;
  BREVO_SMTP_PASS?: string;
  NODE_ENV?: string;
}

// Check if we're running on the client side
const isClient = typeof window !== 'undefined';

let cachedEnv: EnvConfig | null = null;
let validationAttempted = false;

function validateEnv(): EnvConfig {
  // Return cached if already validated
  if (cachedEnv) {
    return cachedEnv;
  }

  // On client side, only return client-safe values without validation
  if (isClient) {
    cachedEnv = {
      FIRE_API_KEY: '', // Not available on client
      FIRE_PROJECT_ID: '', // Not available on client
      CLIENT_ID: '', // Not available on client
      CLIENT_SECRET: '', // Not available on client
      JWT_KEY: '', // Not available on client
      FIRE_DOMAIN: undefined,
      AUTH_CALLBACK: undefined,
      BASE_URL: undefined,
      API_URL: undefined,
      LOGIN_URL: undefined,
      PLATFORM_NAME: undefined,
      ALLOWED_ORIGINS: undefined,
      // Only expose client-safe variables via NEXT_PUBLIC_ prefix
      // Note: For client access, use NEXT_PUBLIC_EMAIL_FROM in environment variables
      EMAIL_FROM: process.env.NEXT_PUBLIC_EMAIL_FROM || 'support@example.com',
      EMAIL_FROM_NAME: undefined,
      EMAIL_REPLY_TO: undefined,
      BREVO_SMTP_HOST: undefined,
      BREVO_SMTP_PORT: undefined,
      BREVO_SMTP_USER: undefined,
      BREVO_SMTP_KEY: undefined,
      BREVO_SMTP_PASS: undefined,
      NODE_ENV: process.env.NODE_ENV,
    };
    validationAttempted = true;
    return cachedEnv;
  }

  // Server-side validation
  const missing: string[] = [];
  
  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  
  // Only throw in production or if explicitly validating
  // In development, allow missing vars but log warnings
  if (missing.length > 0) {
    const errorMsg = `Missing required environment variables: ${missing.join(', ')}`;
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        errorMsg + '\n' +
        'Please ensure all required environment variables are set before starting the application.'
      );
    } else {
      console.warn(`[env.ts] ${errorMsg}`);
      // In dev, use empty strings as fallback to prevent crashes
      cachedEnv = {
        FIRE_API_KEY: process.env.FIRE_API_KEY || '',
        FIRE_PROJECT_ID: process.env.FIRE_PROJECT_ID || '',
        CLIENT_ID: process.env.CLIENT_ID || '',
        CLIENT_SECRET: process.env.CLIENT_SECRET || '',
        JWT_KEY: process.env.JWT_KEY || 'dev-key-min-32-chars-for-validation-12345',
        FIRE_DOMAIN: process.env.FIRE_DOMAIN,
        AUTH_CALLBACK: process.env.AUTH_CALLBACK,
        BASE_URL: process.env.BASE_URL,
        API_URL: process.env.API_URL,
        LOGIN_URL: process.env.LOGIN_URL,
        PLATFORM_NAME: process.env.PLATFORM_NAME,
        ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
        EMAIL_FROM: process.env.EMAIL_FROM,
        EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
        EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
        BREVO_SMTP_HOST: process.env.BREVO_SMTP_HOST,
        BREVO_SMTP_PORT: process.env.BREVO_SMTP_PORT,
        BREVO_SMTP_USER: process.env.BREVO_SMTP_USER,
        BREVO_SMTP_KEY: process.env.BREVO_SMTP_KEY,
        BREVO_SMTP_PASS: process.env.BREVO_SMTP_PASS,
        NODE_ENV: process.env.NODE_ENV,
      };
      validationAttempted = true;
      return cachedEnv;
    }
  }
  
  // Validate JWT key strength (only if provided)
  const jwtKey = process.env.JWT_KEY!;
  if (jwtKey && jwtKey.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'JWT_KEY must be at least 32 characters long for security. ' +
        `Current length: ${jwtKey.length}`
      );
    } else {
      console.warn(`[env.ts] JWT_KEY is too short (${jwtKey.length} chars), should be at least 32 characters`);
    }
  }
  
  cachedEnv = {
    FIRE_API_KEY: process.env.FIRE_API_KEY!,
    FIRE_PROJECT_ID: process.env.FIRE_PROJECT_ID!,
    CLIENT_ID: process.env.CLIENT_ID!,
    CLIENT_SECRET: process.env.CLIENT_SECRET!,
    JWT_KEY: process.env.JWT_KEY!,
    FIRE_DOMAIN: process.env.FIRE_DOMAIN,
    AUTH_CALLBACK: process.env.AUTH_CALLBACK,
    BASE_URL: process.env.BASE_URL,
    API_URL: process.env.API_URL,
    LOGIN_URL: process.env.LOGIN_URL,
    PLATFORM_NAME: process.env.PLATFORM_NAME,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
    EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
    BREVO_SMTP_HOST: process.env.BREVO_SMTP_HOST,
    BREVO_SMTP_PORT: process.env.BREVO_SMTP_PORT,
    BREVO_SMTP_USER: process.env.BREVO_SMTP_USER,
    BREVO_SMTP_KEY: process.env.BREVO_SMTP_KEY,
    BREVO_SMTP_PASS: process.env.BREVO_SMTP_PASS,
    NODE_ENV: process.env.NODE_ENV,
  };
  
  validationAttempted = true;
  return cachedEnv;
}

// Lazy validation - only validate when accessed
function getEnv(): EnvConfig {
  if (!cachedEnv) {
    return validateEnv();
  }
  return cachedEnv;
}

// Export getter that validates on first access
export const env = new Proxy({} as EnvConfig, {
  get(target, prop: string) {
    const envConfig = getEnv();
    return envConfig[prop as keyof EnvConfig];
  }
});

// Helper to check if in development (lazy evaluation)
export const isDev: boolean = (() => {
  try {
    return getEnv().NODE_ENV === 'development';
  } catch {
    // Fallback to process.env if validation hasn't run yet
    return process.env.NODE_ENV === 'development';
  }
})();

// Helper to get allowed origins
export function getAllowedOrigins(): string[] {
  if (!env.ALLOWED_ORIGINS) {
    return [];
  }
  return env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean);
}

