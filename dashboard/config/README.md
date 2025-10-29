# Configuration Files

This directory contains application configuration files.

## Date Format Configuration

The `date-format.ts` file contains the date and time formatting settings used throughout the application.

### Current Implementation

Currently, the date format is set to **German (de-DE)** by default with the following formats:

- **Standard Date**: `15. Januar 2025`
- **Short Date** (tables): `15.01.2025`
- **Date & Time**: `15. Januar 2025, 14:30`
- **Long Date**: `Montag, 15. Januar 2025`

### Future Implementation: User-Configurable Date Formats

To make date formats user-configurable, follow these steps:

#### 1. Database Schema Update

Add a user preferences table:

```prisma
// prisma/schema.prisma

model UserPreferences {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Date format preferences
  dateFormatLocale String  @default("de-DE")

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("user_preferences")
}

// Add relation to User model
model User {
  // ... existing fields
  preferences UserPreferences?
}
```

#### 2. API Endpoints

Create API routes for managing user preferences:

```typescript
// app/api/user/preferences/route.ts

export async function GET(request: NextRequest) {
  // Get current user's preferences
  const userId = await getCurrentUserId();
  const preferences = await prisma.userPreferences.findUnique({
    where: { userId }
  });

  return NextResponse.json(preferences);
}

export async function PUT(request: NextRequest) {
  // Update user's date format preference
  const userId = await getCurrentUserId();
  const { dateFormatLocale } = await request.json();

  const preferences = await prisma.userPreferences.upsert({
    where: { userId },
    update: { dateFormatLocale },
    create: { userId, dateFormatLocale }
  });

  return NextResponse.json(preferences);
}
```

#### 3. Settings UI

Create a settings page for date format selection:

```typescript
// app/dashboard/settings/page.tsx

export default function SettingsPage() {
  const [locale, setLocale] = useState('de-DE');

  const handleSave = async () => {
    await fetch('/api/user/preferences', {
      method: 'PUT',
      body: JSON.stringify({ dateFormatLocale: locale })
    });
  };

  return (
    <div>
      <h1>Date Format Settings</h1>
      <Select value={locale} onValueChange={setLocale}>
        <SelectItem value="de-DE">German (15.01.2025)</SelectItem>
        <SelectItem value="en-US">US (01/15/2025)</SelectItem>
        <SelectItem value="en-GB">UK (15/01/2025)</SelectItem>
        <SelectItem value="ISO-8601">ISO 8601 (2025-01-15)</SelectItem>
      </Select>
      <Button onClick={handleSave}>Save</Button>
    </div>
  );
}
```

#### 4. Context Provider

Create a context to provide date format settings throughout the app:

```typescript
// contexts/DateFormatContext.tsx

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { dateFormatPresets, defaultDateFormatConfig } from '@/config/date-format';
import type { DateFormatConfig } from '@/config/date-format';

const DateFormatContext = createContext<DateFormatConfig>(defaultDateFormatConfig);

export function DateFormatProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState(defaultDateFormatConfig);

  useEffect(() => {
    // Load user preference from API
    fetch('/api/user/preferences')
      .then(res => res.json())
      .then(prefs => {
        if (prefs?.dateFormatLocale) {
          setConfig(dateFormatPresets[prefs.dateFormatLocale] || defaultDateFormatConfig);
        }
      });
  }, []);

  return (
    <DateFormatContext.Provider value={config}>
      {children}
    </DateFormatContext.Provider>
  );
}

export function useDateFormatConfig() {
  return useContext(DateFormatContext);
}
```

#### 5. Update getDateFormatConfig

Modify `config/date-format.ts` to use the context:

```typescript
// This function would be updated to use the context
// Instead of being called directly, formatDate would use the context value
```

#### 6. Wrap App with Provider

```typescript
// app/layout.tsx

import { DateFormatProvider } from '@/contexts/DateFormatContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <DateFormatProvider>
          {children}
        </DateFormatProvider>
      </body>
    </html>
  );
}
```

### Testing

After implementation, test with different locales to ensure:

1. Date formats display correctly in tables
2. Date filters work with all formats
3. Date sorting works correctly
4. User preference persists across sessions
5. Changes in settings update immediately

### Related Files

- `lib/format.ts` - Date formatting utilities
- `components/data-table/data-table-filter-list.tsx` - Date filter UI
- `app/dashboard/test-objects/_lib/queries.ts` - Date filter logic
