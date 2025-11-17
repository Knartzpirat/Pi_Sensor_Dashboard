/**
 * Centralized Environment Configuration
 *
 * This module provides type-safe access to environment variables with validation.
 * All environment variables are validated at startup to fail fast if misconfigured.
 */

/**
 * Environment variable schema
 */
interface EnvironmentVariables {
  // Node.js environment
  NODE_ENV: 'development' | 'production' | 'test';

  // Database
  DATABASE_URL: string;

  // Backend API (Python sensor backend)
  BACKEND_URL: string;              // Server-side only
  NEXT_PUBLIC_BACKEND_URL: string;  // Client-side accessible

  // Frontend URLs
  NEXT_PUBLIC_APP_URL: string;      // Full app URL (for absolute URLs)

  // Security
  ALLOW_SETUP_AGAIN?: 'true' | 'false';

  // Next.js Runtime
  NEXT_RUNTIME?: 'nodejs' | 'edge';
}

/**
 * Default values for development environment
 */
const DEFAULTS: Partial<EnvironmentVariables> = {
  BACKEND_URL: 'http://localhost:8000',
  NEXT_PUBLIC_BACKEND_URL: 'http://localhost:8000',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  ALLOW_SETUP_AGAIN: 'false',
};

/**
 * Required environment variables (no defaults)
 */
const REQUIRED: (keyof EnvironmentVariables)[] = [
  'DATABASE_URL',
];

/**
 * Get environment variable with fallback and validation
 */
function getEnvVar<K extends keyof EnvironmentVariables>(
  key: K,
  fallback?: EnvironmentVariables[K]
): EnvironmentVariables[K] {
  const value = process.env[key] as EnvironmentVariables[K] | undefined;

  if (value !== undefined && value !== '') {
    return value;
  }

  if (fallback !== undefined) {
    return fallback;
  }

  // Check if required
  if (REQUIRED.includes(key)) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Please add ${key} to your .env file.`
    );
  }

  // Should not reach here for optional vars with defaults
  throw new Error(`Environment variable ${key} is not set and has no default`);
}

/**
 * Validated and typed environment configuration
 */
export const env = {
  // Node.js environment
  get NODE_ENV(): 'development' | 'production' | 'test' {
    return (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';
  },

  get isDevelopment(): boolean {
    return this.NODE_ENV === 'development';
  },

  get isProduction(): boolean {
    return this.NODE_ENV === 'production';
  },

  get isTest(): boolean {
    return this.NODE_ENV === 'test';
  },

  // Database
  get DATABASE_URL(): string {
    return getEnvVar('DATABASE_URL');
  },

  // Backend API URLs (Python sensor backend)
  get BACKEND_URL(): string {
    return getEnvVar('BACKEND_URL', DEFAULTS.BACKEND_URL);
  },

  get NEXT_PUBLIC_BACKEND_URL(): string {
    return getEnvVar('NEXT_PUBLIC_BACKEND_URL', DEFAULTS.NEXT_PUBLIC_BACKEND_URL);
  },

  // Use this in API routes (server-side)
  get backendUrl(): string {
    return this.BACKEND_URL;
  },

  // Use this in components (client-side)
  get clientBackendUrl(): string {
    return this.NEXT_PUBLIC_BACKEND_URL;
  },

  // Frontend URLs
  get NEXT_PUBLIC_APP_URL(): string {
    return getEnvVar('NEXT_PUBLIC_APP_URL', DEFAULTS.NEXT_PUBLIC_APP_URL);
  },

  get appUrl(): string {
    return this.NEXT_PUBLIC_APP_URL;
  },

  // Security
  get ALLOW_SETUP_AGAIN(): boolean {
    return getEnvVar('ALLOW_SETUP_AGAIN', DEFAULTS.ALLOW_SETUP_AGAIN) === 'true';
  },

  // Next.js Runtime
  get NEXT_RUNTIME(): 'nodejs' | 'edge' | undefined {
    return process.env.NEXT_RUNTIME as 'nodejs' | 'edge' | undefined;
  },

  get isNodeRuntime(): boolean {
    return this.NEXT_RUNTIME === 'nodejs';
  },
} as const;

/**
 * Validate all environment variables at startup
 * Call this in instrumentation.ts or app startup
 */
export function validateEnv(): void {
  const errors: string[] = [];

  // Check required variables
  for (const key of REQUIRED) {
    try {
      const value = process.env[key];
      if (!value || value.trim() === '') {
        errors.push(`Missing required environment variable: ${key}`);
      }
    } catch (error) {
      errors.push(`Error checking ${key}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Validate DATABASE_URL format
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && !dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://')) {
      errors.push('DATABASE_URL must start with postgres:// or postgresql://');
    }
  } catch (error) {
    // Skip validation if DATABASE_URL not set (will be caught by required check)
  }

  // Validate URL formats for optional URLs
  const urlVars: (keyof EnvironmentVariables)[] = [
    'BACKEND_URL',
    'NEXT_PUBLIC_BACKEND_URL',
    'NEXT_PUBLIC_APP_URL',
  ];

  for (const key of urlVars) {
    try {
      const value = process.env[key] || DEFAULTS[key];
      if (value) {
        new URL(value); // Validates URL format
      }
    } catch (error) {
      errors.push(`Invalid URL format for ${key}: ${process.env[key]}`);
    }
  }

  // Log validation results
  if (errors.length > 0) {
    const errorMessage =
      '\n' +
      '═══════════════════════════════════════════════════════════════\n' +
      '  ❌ Environment Variable Validation Failed\n' +
      '═══════════════════════════════════════════════════════════════\n' +
      errors.map(err => `  • ${err}`).join('\n') + '\n' +
      '═══════════════════════════════════════════════════════════════\n' +
      '\n' +
      'Please fix the above errors in your .env file and restart.\n';

    // Use console directly to avoid circular dependency with logger
    console.error(errorMessage);

    // In production, throw error to prevent startup with invalid config
    if (env.isProduction) {
      throw new Error(errorMessage);
    }
  } else {
    // Use console directly to avoid circular dependency with logger
    console.log('\n✅ Environment variables validated successfully');
    console.log('   NODE_ENV:', env.NODE_ENV);
    console.log('   Backend URL:', env.BACKEND_URL);
    console.log('   App URL:', env.NEXT_PUBLIC_APP_URL);
    console.log('   Setup Allowed:', env.ALLOW_SETUP_AGAIN);
    console.log('');
  }
}

/**
 * Get a summary of current environment configuration
 * Useful for debugging and logging
 */
export function getEnvSummary(): Record<string, unknown> {
  return {
    NODE_ENV: env.NODE_ENV,
    isDevelopment: env.isDevelopment,
    isProduction: env.isProduction,
    backendUrl: env.BACKEND_URL,
    clientBackendUrl: env.NEXT_PUBLIC_BACKEND_URL,
    appUrl: env.NEXT_PUBLIC_APP_URL,
    allowSetupAgain: env.ALLOW_SETUP_AGAIN,
    runtime: env.NEXT_RUNTIME,
    // Never log DATABASE_URL for security reasons
    hasDatabaseUrl: !!process.env.DATABASE_URL,
  };
}

// Export type for external use
export type Env = typeof env;
