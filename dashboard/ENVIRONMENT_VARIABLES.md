# Environment Variables Documentation

## Overview

This document describes all environment variables used in the Pi Sensor Dashboard application. Environment variables are centrally managed through [`lib/env.ts`](lib/env.ts), which provides type-safe access and validation.

## Quick Start

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your actual values in `.env`

3. The application validates all required environment variables at startup

## Environment Variables Reference

### Required Variables

#### `DATABASE_URL`
**Format:** `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`
**Example:** `postgresql://postgres:password@localhost:5432/pi_sensor_dashboard`
**Used by:** Prisma ORM for database connection
**Validation:** Must be a valid PostgreSQL connection string

PostgreSQL connection string for the application database. This is the primary data store for test objects, sensors, measurements, users, and all application data.

---

### Optional Variables (with defaults)

#### `BACKEND_URL`
**Default:** `http://localhost:8000`
**Used by:** Server-side API routes (Next.js API routes)
**Access:** `env.backendUrl`

URL of the Python FastAPI backend that controls sensors and hardware. Used exclusively by server-side code (API routes). This should point to the internal network address of the backend.

**Examples:**
- Development: `http://localhost:8000`
- Production (same machine): `http://localhost:8000`
- Production (Docker): `http://backend:8000`
- Production (separate machine): `http://192.168.1.100:8000`

---

#### `NEXT_PUBLIC_BACKEND_URL`
**Default:** `http://localhost:8000`
**Used by:** Client-side code (browser)
**Access:** `env.clientBackendUrl`

URL of the Python FastAPI backend accessible from the user's browser. This must be a URL that the browser can reach.

**Important:** All variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

**Examples:**
- Development: `http://localhost:8000`
- Production (same network): `http://192.168.1.100:8000`
- Production (reverse proxy): `https://sensors.example.com/api`

---

#### `NEXT_PUBLIC_APP_URL`
**Default:** `http://localhost:3000`
**Used by:** Internal API calls, webhooks, background jobs
**Access:** `env.appUrl`

URL where the Next.js application is accessible. Used for:
- Background polling service making internal API calls
- Webhook callbacks
- Server-to-server communication

**Examples:**
- Development: `http://localhost:3000`
- Production (same machine): `http://localhost:3000`
- Production (Docker): `http://dashboard:3000`
- Production (public): `https://dashboard.example.com`

---

#### `NODE_ENV`
**Default:** `development`
**Values:** `development`, `production`, `test`
**Used by:** Logging, error detail level, caching, Prisma query logging
**Access:** `env.NODE_ENV`, `env.isDevelopment`, `env.isProduction`, `env.isTest`

Node.js environment mode. Automatically set by Next.js but can be overridden.

**Effects:**
- **Development:** Verbose logging, detailed error messages, Prisma query logging
- **Production:** Minimal logging, generic error messages, no query logging
- **Test:** Used during automated testing

---

#### `ALLOW_SETUP_AGAIN`
**Default:** `false`
**Values:** `true`, `false`
**Used by:** Setup wizard
**Access:** `env.ALLOW_SETUP_AGAIN`

Security feature that prevents the setup wizard from running after initial setup is complete. Set to `true` only during development or when you need to reset the application.

**Warning:** ⚠️ Never set this to `true` in production unless you're intentionally resetting the system. This allows creating a new admin user and overwriting the database.

---

## Usage in Code

### Importing

```typescript
import { env } from '@/lib/env';
```

### Accessing Values

```typescript
// Raw values
const dbUrl = env.DATABASE_URL;
const nodeEnv = env.NODE_ENV;

// Convenience getters
const backendUrl = env.backendUrl;        // Server-side backend URL
const clientBackendUrl = env.clientBackendUrl; // Client-side backend URL
const appUrl = env.appUrl;                // Application URL

// Boolean helpers
const isDev = env.isDevelopment;
const isProd = env.isProduction;
const isTest = env.isTest;

// Special values
const runtime = env.NEXT_RUNTIME;         // 'nodejs' | 'edge'
```

### Validation

Environment variables are automatically validated at application startup in [`instrumentation.ts`](instrumentation.ts):

```typescript
import { validateEnv } from '@/lib/env';

validateEnv(); // Throws error if required vars missing or invalid
```

### Getting Environment Summary

For debugging, you can get a summary of all environment variables:

```typescript
import { getEnvSummary } from '@/lib/env';

console.log(getEnvSummary());
// {
//   NODE_ENV: 'development',
//   isDevelopment: true,
//   isProduction: false,
//   isTest: false,
//   hasDatabaseUrl: true,
//   backendUrl: 'http://localhost:8000',
//   ...
// }
```

## Environment-Specific Configurations

### Development

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pi_sensor_dev"
BACKEND_URL="http://localhost:8000"
NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
ALLOW_SETUP_AGAIN="true"
```

### Production (Single Machine)

```env
DATABASE_URL="postgresql://pi_dashboard:SECURE_PASSWORD@localhost:5432/pi_sensor_dashboard"
BACKEND_URL="http://localhost:8000"
NEXT_PUBLIC_BACKEND_URL="http://192.168.1.100:8000"
NEXT_PUBLIC_APP_URL="http://192.168.1.100:3000"
NODE_ENV="production"
ALLOW_SETUP_AGAIN="false"
```

### Production (Docker Compose)

```env
DATABASE_URL="postgresql://pi_dashboard:SECURE_PASSWORD@postgres:5432/pi_sensor_dashboard"
BACKEND_URL="http://backend:8000"
NEXT_PUBLIC_BACKEND_URL="https://api.example.com"
NEXT_PUBLIC_APP_URL="https://dashboard.example.com"
NODE_ENV="production"
ALLOW_SETUP_AGAIN="false"
```

## Validation Rules

The following validation is performed at startup:

1. **DATABASE_URL**: Must be present and non-empty
2. **BACKEND_URL**: Must be a valid URL (defaults if missing)
3. **NEXT_PUBLIC_BACKEND_URL**: Must be a valid URL (defaults if missing)
4. **NEXT_PUBLIC_APP_URL**: Must be a valid URL (defaults if missing)
5. **NODE_ENV**: Must be 'development', 'production', or 'test'
6. **ALLOW_SETUP_AGAIN**: Must be 'true' or 'false' (defaults to false)

If validation fails, the application will not start and will log detailed error messages.

## Common Issues

### Issue: Database Connection Failed
**Solution:** Check `DATABASE_URL` format and ensure PostgreSQL is running

### Issue: Backend Not Reachable from Browser
**Solution:** Verify `NEXT_PUBLIC_BACKEND_URL` is accessible from the user's browser (not just localhost)

### Issue: Background Polling Not Working
**Solution:** Ensure `NEXT_PUBLIC_APP_URL` points to the correct Next.js instance

### Issue: Setup Wizard Won't Run Again
**Solution:** Set `ALLOW_SETUP_AGAIN="true"` (development only)

## Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Use strong database passwords** in production
3. **Set `ALLOW_SETUP_AGAIN="false"`** in production
4. **Use HTTPS** for `NEXT_PUBLIC_*` URLs in production
5. **Restrict `DATABASE_URL`** access with firewall rules
6. **Rotate credentials** regularly

## Migration from Direct process.env

Previously, the application accessed environment variables directly via `process.env`:

```typescript
// ❌ Old way (inconsistent, no validation)
const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
const isProd = process.env.NODE_ENV === 'production';
```

Now use the centralized `env` module:

```typescript
// ✅ New way (type-safe, validated, consistent)
import { env } from '@/lib/env';
const backendUrl = env.backendUrl;
const isProd = env.isProduction;
```

## See Also

- [`lib/env.ts`](lib/env.ts) - Environment configuration implementation
- [`.env.example`](.env.example) - Example environment file
- [`instrumentation.ts`](instrumentation.ts) - Startup validation
- [`MIGRATION_SUMMARY.md`](MIGRATION_SUMMARY.md) - Overall migration status
