# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pi_Sensor_Dashboard is a Next.js 16 full-stack application for managing test objects with sensor data. Built with TypeScript, React 19, Tailwind CSS, and PostgreSQL via Prisma ORM. Features custom JWT authentication, file uploads, internationalization (EN/DE), and an advanced data table system.

## Development Commands

### Database

```bash
# Generate Prisma client after schema changes
pnpm prisma generate

# Push schema changes to database (development)
pnpm prisma db push

# Open Prisma Studio to view/edit data
pnpm prisma studio

# Create a migration (production)
pnpm prisma migrate dev --name migration_name
```

### Development

```bash
# Start development server (includes predev: prisma generate)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

### Testing

No test framework is currently configured.

## Architecture Overview

### Technology Stack

- **Frontend:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS
- **UI:** shadcn/ui (Radix UI primitives), Lucide icons, Motion animations
- **Backend:** Next.js API Routes, Prisma ORM, PostgreSQL
- **Auth:** Custom JWT with refresh tokens (httpOnly cookies)
- **i18n:** next-intl (English/German)
- **Forms:** React Hook Form + Zod validation
- **Tables:** TanStack Table with URL-based state (nuqs)
- **File Upload:** Local filesystem storage in `public/uploads/`

### Directory Structure

```
dashboard/
├── app/
│   ├── api/                  # API Routes (REST endpoints)
│   ├── dashboard/            # Protected area
│   │   └── test-objects/     # Feature folder pattern
│   │       ├── _components/  # Private feature components
│   │       ├── _lib/        # Private feature logic
│   │       └── page.tsx
│   ├── login/
│   ├── setup/               # One-time setup wizard
│   └── layout.tsx
├── components/              # Shared components
│   ├── ui/                 # shadcn/ui primitives
│   ├── data-table/         # Advanced table system
│   └── app-sidebar/
├── lib/                    # Shared utilities
│   ├── prisma.ts          # Singleton Prisma client
│   └── validations/       # Zod schemas
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript definitions
├── messages/              # i18n translations (en.json, de.json)
└── prisma/
    └── schema.prisma      # Database schema
```

### Database Schema (Prisma)

**Core Entities:**

- **User** - Authentication (username, hashed password, role)
- **RefreshToken** - Session management (token, expiresAt, persistent flag)
- **RecoveryCode** - Password recovery (8 codes per user, single-use)
- **SetupStatus** - One-time setup completion tracker
- **Label** - Reusable tags with color (polymorphic via type field)
- **TestObject** - Main entity (title, description, label relation)
- **Picture** - Images with ordering (polymorphic: entityType/entityId)
- **Document** - PDFs with ordering (polymorphic: entityType/entityId)

**Key Patterns:**

- **Polymorphic Relations:** Picture and Document use `entityType` + `entityId` to attach to any entity type
- **Soft Ordering:** `order` field enables drag-and-drop reordering
- **EntityType Enum:** Type-safe polymorphic relations (TEST_OBJECT, SENSOR, USER_PROFILE, etc.)

### Authentication Flow

1. **Setup (First Run):** `/setup` creates admin user, generates 8 recovery codes (format: XXX-XXX-XXX)
2. **Login:** POST `/api/auth/login` → httpOnly refresh token cookie (7 days normal, 30 days persistent)
3. **Session:** Refresh tokens stored in database with IP/user agent tracking
4. **Recovery:** Verify recovery code → reset password (codes are single-use)

**Security Features:**
- bcrypt password hashing
- httpOnly cookies (XSS protection)
- Refresh token rotation support
- Recovery code system
- IP and user agent tracking

### API Routes Pattern

All API routes follow this structure:

```typescript
// app/api/[resource]/route.ts
export async function GET(request: NextRequest) {
  const prisma = getPrismaClient();
  try {
    // Query logic
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
```

**Key Endpoints:**

- `GET /api/test-objects` - List with optional filtering
- `POST /api/test-objects` - Create
- `GET /api/test-objects/[id]` - Get single (supports `?includePictures=true&includeDocuments=true`)
- `PUT /api/test-objects/[id]` - Update
- `DELETE /api/test-objects/[id]` - Delete
- `POST /api/uploads` - Upload files (FormData with `images[]`, `documents[]`, order metadata)
- `DELETE /api/pictures/[id]` - Delete picture (removes file + DB record)
- `PATCH /api/pictures/[id]` - Update order
- `DELETE /api/documents/[id]` - Delete document (removes file + DB record)
- `PATCH /api/documents/[id]` - Update order

### File Upload System

**Flow:**

1. Client: FileUpload component (drag & drop + file picker)
2. API: POST `/api/uploads` with FormData
3. Storage: `public/uploads/images/` or `public/uploads/documents/`
4. Naming: `{timestamp}-{random}.{ext}`
5. Database: Picture/Document record with polymorphic relation + order field
6. Delete: Removes file from filesystem + database, reorders remaining items

**Supported Types:**
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF

### Data Table System

**Advanced Features:**

- Server-side ready, currently client-side filtered for performance
- URL-based state (page, perPage, sort, filters, joinOperator)
- Debounced updates (300ms) via `useDataTable` hook
- Filter types: text, select, multi-select, date, range
- Column features: sort, pin, hide, resize
- Row selection, CSV export
- Feature flags for advanced/normal filter modes

**State Flow:**

```
Server Component → fetch data → Client Component
    ↓
useDataTable hook → TanStack Table → URL sync (nuqs)
    ↓
User interaction → debounced URL update → Server re-render
```

### Component Architecture

**Server-First Approach:**

- Default to Server Components
- `'use client'` only for interactivity
- Fetch data in Server Components
- Pass data down as props

**Component Categories:**

- **UI Primitives** (`components/ui/`): Button, Input, Dialog, Table, etc. (shadcn/ui)
- **Compound Components**: FileUpload, Editable, Sortable, DataTable
- **Feature Components**: TestObjectsTable, TestObjectEditDrawer
- **Layout Components**: AppSidebar, AppNavbar

**Styling:**

- Tailwind utility classes
- CSS variables for theming (dark/light mode)
- Design tokens in `app/globals.css`
- `cn()` utility for conditional classes

### Internationalization

**Implementation:**

- Framework: next-intl
- Locales: English (en), German (de)
- Storage: Cookie-based preference
- Files: `messages/en.json`, `messages/de.json`

**Usage:**

```typescript
const t = useTranslations('namespace');
return <h1>{t('key')}</h1>;
```

### State Management

**URL State (nuqs):**
- All table state lives in URL params (shareable/bookmarkable)
- Debounced updates for performance
- History management (push/replace)

**Server State:**
- Server Components fetch directly
- `unstable_noStore` prevents caching
- Fresh data on each navigation

**Client State:**
- Forms: React Hook Form + Zod
- Theme: next-themes (localStorage)
- Locale: Cookie

## Development Patterns

### Adding a New Feature

1. Create feature folder: `app/dashboard/[feature]/`
2. Add page component: `page.tsx` (Server Component)
3. Add private components: `_components/`
4. Add private logic: `_lib/`
5. Update sidebar navigation in `components/app-sidebar/`
6. Add translations to `messages/en.json` and `messages/de.json`
7. Create API routes: `app/api/[resource]/route.ts`
8. Update Prisma schema if needed, then run `pnpm prisma generate && pnpm prisma db push`

### Adding a New Entity Type

To leverage polymorphic Picture/Document system:

1. Add new type to `EntityType` enum in [schema.prisma](dashboard/prisma/schema.prisma)
2. Create entity model with standard fields
3. Pictures/Documents automatically attach via `entityType` + `entityId`
4. Use existing FileUpload component and API endpoints
5. Update TypeScript types in `types/`

### Working with Forms

1. Create Zod schema in `lib/validations/`
2. Use React Hook Form with Zod resolver
3. Use shadcn/ui form components (`components/ui/form/`)
4. Server-side validation in API routes (re-use Zod schema)

### Working with Data Tables

1. Define columns with `createDataTableColumns()`
2. Use `useDataTable` hook for state management
3. Wrap in `DataTable` component
4. Configure filters in column definitions
5. Table state automatically synced to URL

### Working with File Uploads

**For new entity types:**

1. Pass `entityType` and `entityId` to FileUpload component
2. Use existing POST `/api/uploads` endpoint
3. Query pictures/documents filtered by entity: `where: { entityType, entityId }`
4. Delete uses existing DELETE endpoints
5. Reorder uses existing PATCH endpoints

**Validation:**

Client-side validation in FileUpload component, server-side validation in `/api/uploads/route.ts`.

### Authentication Checks

**Server Components:**

```typescript
import { cookies } from 'next/headers';
const refreshToken = (await cookies()).get('refreshToken')?.value;
if (!refreshToken) redirect('/login');
```

**API Routes:**

Check refresh token cookie, verify with database. No middleware.ts currently implemented.

## Important Files

**Core Infrastructure:**

- [dashboard/prisma/schema.prisma](dashboard/prisma/schema.prisma) - Database schema
- [dashboard/lib/prisma.ts](dashboard/lib/prisma.ts) - Prisma client singleton
- [dashboard/lib/token-helper.ts](dashboard/lib/token-helper.ts) - JWT utilities
- [dashboard/app/layout.tsx](dashboard/app/layout.tsx) - Root layout
- [dashboard/app/dashboard/layout.tsx](dashboard/app/dashboard/layout.tsx) - Dashboard layout with sidebar

**Feature Example:**

- [dashboard/app/dashboard/test-objects/page.tsx](dashboard/app/dashboard/test-objects/page.tsx) - Server Component entry point
- [dashboard/app/dashboard/test-objects/_components/test-objects-table.tsx](dashboard/app/dashboard/test-objects/_components/test-objects-table.tsx) - Client Component table
- [dashboard/app/api/test-objects/route.ts](dashboard/app/api/test-objects/route.ts) - API endpoints

**Data Table System:**

- [dashboard/hooks/use-data-table.ts](dashboard/hooks/use-data-table.ts) - State management hook
- [dashboard/components/data-table/data-table.tsx](dashboard/components/data-table/data-table.tsx) - Table component
- [dashboard/types/data-table.ts](dashboard/types/data-table.ts) - Type definitions

**File Upload:**

- [dashboard/components/file-upload.tsx](dashboard/components/file-upload.tsx) - Upload component
- [dashboard/app/api/uploads/route.ts](dashboard/app/api/uploads/route.ts) - Upload handler

## Environment Setup

Required `.env` file in `dashboard/` directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pi_sensor_dashboard"
ALLOW_SETUP_AGAIN="false"  # Security: prevents setup re-runs
```

## Common Issues

**Prisma Client Not Generated:**

Run `pnpm prisma generate` or `pnpm dev` (includes predev hook).

**Database Schema Out of Sync:**

Run `pnpm prisma db push` (development) or `pnpm prisma migrate dev` (production).

**Setup Page Not Accessible:**

Check SetupStatus table - if `isCompleted=true`, setup cannot be re-run unless `ALLOW_SETUP_AGAIN=true` in `.env`.

**File Upload Fails:**

Ensure `public/uploads/images/` and `public/uploads/documents/` directories exist and are writable.

## Future Enhancements

Based on code comments and structure:

1. **User-Configurable Date Formats:** Add UserPreferences table, settings page (see [dashboard/config/README.md](dashboard/config/README.md))
2. **Additional Entity Types:** SENSOR, MEASUREMENT (leverage existing polymorphic system)
3. **Route Protection Middleware:** Implement middleware.ts for centralized auth checks
4. **Real-time Updates:** WebSocket support for live sensor data
5. **Advanced Analytics:** Utilize installed Recharts library for data visualization
