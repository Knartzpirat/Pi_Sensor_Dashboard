# Performance Optimization Documentation

## Overview

This document describes the current performance state of the Pi Sensor Dashboard and provides guidelines for implementing caching, pagination, streaming, and other performance optimizations.

## Current Performance State

### ✅ Existing Optimizations

#### 1. **Database Query Optimization**
- **N+1 Query Prevention** ([PERFORMANCE_OPTIMIZATIONS.md](PERFORMANCE_OPTIMIZATIONS.md)):
  - Test objects with pictures: Single query instead of N+1
  - Batch loading patterns implemented
  - Index optimization on frequently queried columns

#### 2. **Database Indexes** ([DATABASE_INDEXES.md](DATABASE_INDEXES.md)):
  - `TestObject.updatedAt` index (~40x faster sorting)
  - `SensorReading(measurementId, entityId)` composite index (~50x faster filtering)
  - Optimized query planner usage

#### 3. **Performance Tracking**:
  - Logger with `trackPerformance()` for monitoring
  - Query execution time tracking
  - Operation-level performance metrics

#### 4. **Connection Pooling**:
  - Prisma connection pooling configured
  - Singleton pattern prevents multiple clients

---

## 🚨 Performance Gaps Identified (Problem #14)

### Critical Issues

#### 1. **No Response Caching Headers**
**Impact:** HIGH - Repeated requests fetch same data unnecessarily

**Problem:**
- **1 caching header** found across all API routes (nearly zero)
- No `Cache-Control`, `ETag`, or `Last-Modified` headers
- Static data refetched on every request
- Browser/CDN cannot cache responses

**Affected Endpoints:**
- `GET /api/test-objects` - Rarely changing data
- `GET /api/labels` - Static label list
- `GET /api/sensors` - Sensor configuration
- `GET /api/hardware/config` - Hardware settings
- `GET /api/measurements/[id]` - Completed measurements

**Current Response:**
```typescript
// No caching headers
return NextResponse.json({ testObjects });
```

**Required Fix:**
```typescript
// Immutable resources (completed measurements)
export async function GET(request: NextRequest) {
  const measurement = await prisma.measurement.findUnique({
    where: { id, status: 'COMPLETED' }
  });

  return NextResponse.json(
    { measurement },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600, immutable',
        'ETag': `"${measurement.id}-${measurement.updatedAt.getTime()}"`,
      },
    }
  );
}

// Frequently changing resources (sensor readings)
return NextResponse.json(
  { readings },
  {
    headers: {
      'Cache-Control': 'private, no-cache, must-revalidate',
    },
  }
);

// Semi-static resources (test objects)
return NextResponse.json(
  { testObjects },
  {
    headers: {
      'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
      'ETag': `"test-objects-${lastModified.getTime()}"`,
    },
  }
);
```

**Benefits:**
- Reduced server load
- Faster client-side navigation
- Lower bandwidth usage
- Better user experience

---

#### 2. **Missing Pagination for Large Datasets**
**Impact:** HIGH - Performance degrades with data growth

**Problem:**
- **Limited pagination** implementation found
- Most endpoints return ALL records
- Sensor readings endpoint loads entire hour of data
- Test objects endpoint returns full list
- Measurements endpoint loads all measurements with relations

**Current Implementation:**
```typescript
// app/api/sensor-readings/route.ts - No pagination
const readings = await prisma.sensorReading.findMany({
  where: { timestamp: { gte: fromDate, lte: toDate } },
  include: { entity: { include: { sensor: true } } },
  orderBy: { timestamp: 'asc' },
});
// Could be thousands of records!

// app/api/measurements/route.ts - No pagination
const measurements = await prisma.measurement.findMany({
  include: {
    measurementSensors: {
      include: { sensor: true, testObject: true },
    },
  },
  orderBy: { startTime: 'desc' },
});
// Loads ALL measurements with nested relations!

// app/api/test-objects/route.ts - No pagination
const testObjects = await prisma.testObject.findMany({
  include: { labels: true },
  orderBy: { createdAt: 'desc' },
});
// Loads ALL test objects!
```

**Required Implementation - Cursor-Based Pagination:**
```typescript
/**
 * GET /api/measurements?cursor=<id>&limit=20
 * Cursor-based pagination for infinite scroll
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cursor = searchParams.get('cursor');
  const limit = parseInt(searchParams.get('limit') || '20');

  const measurements = await prisma.measurement.findMany({
    take: limit + 1, // Fetch one extra to check if there's a next page
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // Skip the cursor
    }),
    include: {
      measurementSensors: {
        include: { sensor: true, testObject: true },
      },
    },
    orderBy: { startTime: 'desc' },
  });

  const hasNextPage = measurements.length > limit;
  const items = hasNextPage ? measurements.slice(0, -1) : measurements;
  const nextCursor = hasNextPage ? items[items.length - 1].id : null;

  return NextResponse.json({
    items,
    nextCursor,
    hasNextPage,
  });
}
```

**Required Implementation - Offset-Based Pagination:**
```typescript
/**
 * GET /api/sensor-readings?page=1&limit=100
 * Offset-based pagination for page navigation
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = (page - 1) * limit;

  const [readings, totalCount] = await Promise.all([
    prisma.sensorReading.findMany({
      where: { /* filters */ },
      skip: offset,
      take: limit,
      orderBy: { timestamp: 'asc' },
    }),
    prisma.sensorReading.count({
      where: { /* same filters */ },
    }),
  ]);

  return NextResponse.json({
    data: readings,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page * limit < totalCount,
      hasPrevPage: page > 1,
    },
  });
}
```

**Endpoints Requiring Pagination:**
1. `GET /api/measurements` - All measurements (critical)
2. `GET /api/sensor-readings` - Sensor readings (critical)
3. `GET /api/test-objects` - Test objects list (medium)
4. `GET /api/measurements/[id]/readings` - Measurement readings (critical)
5. `GET /api/labels` - Label list (low - usually small)

---

#### 3. **No Streaming for Large Sensor Readings**
**Impact:** MEDIUM - High memory usage and slow initial response

**Problem:**
- **No streaming** implementation found (3 generic "stream" mentions only)
- Sensor readings loaded entirely into memory
- Large JSON responses block event loop
- No support for real-time data streaming
- Measurement readings could be GB in size

**Current Implementation:**
```typescript
// app/api/sensor-readings/route.ts
const readings = await prisma.sensorReading.findMany({ where, include, orderBy });

// Transform all data in memory
const graphData = Object.values(dataPoints).sort((a, b) => a.timestamp - b.timestamp);

// Send entire payload at once
return NextResponse.json({
  success: true,
  data: graphData, // Could be MB of data!
  count: graphData.length,
});
```

**Required Implementation - Streaming Response:**
```typescript
/**
 * GET /api/sensor-readings/stream
 * Stream sensor readings with Server-Sent Events (SSE)
 */
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Stream readings in chunks
        const cursor = prisma.sensorReading.findMany({
          where,
          orderBy: { timestamp: 'asc' },
        });

        for await (const reading of cursor) {
          const chunk = encoder.encode(
            `data: ${JSON.stringify(reading)}\n\n`
          );
          controller.enqueue(chunk);
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

**Required Implementation - Chunked JSON Streaming:**
```typescript
/**
 * GET /api/measurements/[id]/readings/export
 * Export large measurement data as chunked JSON
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send array opening
        controller.enqueue(encoder.encode('['));

        let isFirst = true;
        const chunkSize = 1000;
        let skip = 0;

        while (true) {
          const readings = await prisma.sensorReading.findMany({
            where: { measurementId: id },
            skip,
            take: chunkSize,
            orderBy: { timestamp: 'asc' },
          });

          if (readings.length === 0) break;

          for (const reading of readings) {
            const separator = isFirst ? '' : ',';
            isFirst = false;
            controller.enqueue(
              encoder.encode(`${separator}${JSON.stringify(reading)}`)
            );
          }

          if (readings.length < chunkSize) break;
          skip += chunkSize;
        }

        // Send array closing
        controller.enqueue(encoder.encode(']'));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="measurement-${id}-readings.json"`,
    },
  });
}
```

**Benefits:**
- Lower memory usage
- Faster time-to-first-byte
- Progressive rendering on client
- Support for GB-sized exports
- Better user experience with progress indicators

---

### Medium Priority Issues

#### 4. **No Response Compression**
**Impact:** MEDIUM - Increased bandwidth usage

**Problem:**
- No explicit compression configuration
- Next.js compression may not be optimized
- Large JSON payloads sent uncompressed

**Required Configuration:**
```typescript
// next.config.js
module.exports = {
  compress: true, // Enable compression
  experimental: {
    // Additional compression options
  },
};
```

---

#### 5. **No Request Deduplication**
**Impact:** MEDIUM - Duplicate simultaneous requests

**Problem:**
- Multiple components may request same data simultaneously
- No client-side request deduplication
- No server-side request coalescing

**Client-Side Solution:**
```typescript
// Use SWR or React Query for automatic deduplication
import useSWR from 'swr';

function useMeasurements() {
  const { data, error } = useSWR('/api/measurements', fetcher, {
    dedupingInterval: 2000, // Dedupe requests within 2 seconds
    revalidateOnFocus: false,
  });

  return { measurements: data, loading: !data && !error, error };
}
```

---

#### 6. **No Database Connection Pooling Tuning**
**Impact:** MEDIUM - Inefficient connection usage

**Current State:**
```typescript
// lib/prisma.ts - Default pooling
new PrismaClient({
  log: env.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
});
```

**Required Tuning:**
```typescript
// DATABASE_URL with pool settings
DATABASE_URL="postgresql://user:password@localhost:5432/db?connection_limit=20&pool_timeout=20"

// Or via Prisma schema
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // Connection pool settings
  // connection_limit = 20
  // pool_timeout = 20
}
```

---

#### 7. **No Selective Field Loading**
**Impact:** MEDIUM - Over-fetching data

**Problem:**
- Full models loaded when only specific fields needed
- Large text fields always included

**Current:**
```typescript
const testObjects = await prisma.testObject.findMany({
  include: { labels: true }, // Loads all label fields
});
```

**Optimized:**
```typescript
const testObjects = await prisma.testObject.findMany({
  select: {
    id: true,
    title: true,
    createdAt: true,
    labels: {
      select: {
        id: true,
        name: true,
        color: true,
        // Omit description if not needed
      },
    },
  },
});
```

---

#### 8. **No Lazy Loading for Relations**
**Impact:** MEDIUM - Unnecessary data loaded

**Problem:**
- Pictures always loaded even if not displayed
- Measurement sensors always include full relations

**Solution:**
```typescript
// Only load pictures when needed via query param
const includePictures = searchParams.get('includePictures') === 'true';

const testObjects = await prisma.testObject.findMany({
  include: {
    labels: true,
    ...(includePictures && {
      pictures: {
        orderBy: { order: 'asc' },
        take: 5, // Limit to first 5
      },
    }),
  },
});
```

---

## Implementation Guide

### 1. Response Caching Strategy

#### Cache-Control Header Values

```typescript
// Immutable resources (never change)
'Cache-Control': 'public, max-age=31536000, immutable'
// Examples: completed measurements, uploaded images

// Static resources (rarely change)
'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
// Examples: labels, hardware config

// Semi-static resources (change occasionally)
'Cache-Control': 'private, max-age=60, stale-while-revalidate=300'
// Examples: test objects list, sensor list

// Dynamic resources (change frequently)
'Cache-Control': 'private, no-cache, must-revalidate'
// Examples: sensor readings, active measurements

// Private user data
'Cache-Control': 'private, max-age=0, no-store'
// Examples: user profile, auth tokens
```

#### ETag Implementation

```typescript
import { createHash } from 'crypto';

export function generateETag(data: unknown): string {
  const hash = createHash('md5')
    .update(JSON.stringify(data))
    .digest('hex');
  return `"${hash}"`;
}

export async function GET(request: NextRequest) {
  const testObjects = await prisma.testObject.findMany();

  const etag = generateETag(testObjects);
  const ifNoneMatch = request.headers.get('if-none-match');

  if (ifNoneMatch === etag) {
    return new NextResponse(null, { status: 304 }); // Not Modified
  }

  return NextResponse.json(
    { testObjects },
    {
      headers: {
        'ETag': etag,
        'Cache-Control': 'private, max-age=60',
      },
    }
  );
}
```

#### Last-Modified Implementation

```typescript
export async function GET(request: NextRequest) {
  const testObjects = await prisma.testObject.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 1,
  });

  const lastModified = testObjects[0]?.updatedAt || new Date();
  const ifModifiedSince = request.headers.get('if-modified-since');

  if (ifModifiedSince && new Date(ifModifiedSince) >= lastModified) {
    return new NextResponse(null, { status: 304 });
  }

  return NextResponse.json(
    { testObjects },
    {
      headers: {
        'Last-Modified': lastModified.toUTCString(),
        'Cache-Control': 'private, max-age=60',
      },
    }
  );
}
```

---

### 2. Pagination Patterns

#### Pattern 1: Cursor-Based (Recommended for Infinite Scroll)

**Pros:**
- Consistent results (no skipped/duplicate items)
- Better performance for large offsets
- Works well with real-time data

**Cons:**
- No "jump to page" functionality
- Requires stable cursor field

**Implementation:**
```typescript
interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

export async function paginateCursor<T>(
  model: any,
  options: {
    cursor?: string;
    limit?: number;
    where?: any;
    include?: any;
    orderBy?: any;
  }
): Promise<PaginatedResponse<T>> {
  const limit = options.limit || 20;

  const items = await model.findMany({
    take: limit + 1,
    ...(options.cursor && {
      cursor: { id: options.cursor },
      skip: 1,
    }),
    where: options.where,
    include: options.include,
    orderBy: options.orderBy || { createdAt: 'desc' },
  });

  const hasNextPage = items.length > limit;
  const results = hasNextPage ? items.slice(0, -1) : items;
  const nextCursor = hasNextPage ? results[results.length - 1].id : null;

  return {
    items: results,
    nextCursor,
    hasNextPage,
  };
}
```

#### Pattern 2: Offset-Based (Recommended for Page Numbers)

**Pros:**
- Jump to any page
- Familiar UX pattern
- Easy total count

**Cons:**
- Performance degrades with large offsets
- Possible duplicate/skipped items with concurrent changes

**Implementation:**
```typescript
interface OffsetPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export async function paginateOffset<T>(
  model: any,
  options: {
    page?: number;
    limit?: number;
    where?: any;
    include?: any;
    orderBy?: any;
  }
): Promise<OffsetPaginatedResponse<T>> {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const offset = (page - 1) * limit;

  const [data, totalCount] = await Promise.all([
    model.findMany({
      skip: offset,
      take: limit,
      where: options.where,
      include: options.include,
      orderBy: options.orderBy || { createdAt: 'desc' },
    }),
    model.count({ where: options.where }),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page * limit < totalCount,
      hasPrevPage: page > 1,
    },
  };
}
```

---

### 3. Streaming Patterns

#### Pattern 1: Server-Sent Events (SSE)

**Use Case:** Real-time sensor readings

```typescript
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        // Send initial data
        sendEvent({ type: 'connected', timestamp: Date.now() });

        // Polling loop for new readings
        const interval = setInterval(async () => {
          const readings = await fetchLatestReadings();
          sendEvent({ type: 'readings', data: readings });
        }, 1000);

        // Cleanup on close
        request.signal.addEventListener('abort', () => {
          clearInterval(interval);
          controller.close();
        });
      } catch (error) {
        sendEvent({ type: 'error', message: error.message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

**Client-Side:**
```typescript
function useSensorStream(entityIds: string[]) {
  const [readings, setReadings] = useState<Reading[]>([]);

  useEffect(() => {
    const eventSource = new EventSource(
      `/api/sensor-readings/stream?entityIds=${entityIds.join(',')}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'readings') {
        setReadings(prev => [...prev, ...data.data]);
      }
    };

    return () => eventSource.close();
  }, [entityIds]);

  return readings;
}
```

#### Pattern 2: Chunked JSON Export

**Use Case:** Export large measurement data

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const measurementId = searchParams.get('id');
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode('['));

        let skip = 0;
        const chunkSize = 1000;
        let isFirst = true;

        while (true) {
          const readings = await prisma.sensorReading.findMany({
            where: { measurementId },
            skip,
            take: chunkSize,
            orderBy: { timestamp: 'asc' },
          });

          if (readings.length === 0) break;

          for (const reading of readings) {
            const prefix = isFirst ? '' : ',';
            isFirst = false;
            controller.enqueue(
              encoder.encode(`${prefix}${JSON.stringify(reading)}`)
            );
          }

          if (readings.length < chunkSize) break;
          skip += chunkSize;

          // Allow event loop to process other tasks
          await new Promise(resolve => setImmediate(resolve));
        }

        controller.enqueue(encoder.encode(']'));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="readings-${measurementId}.json"`,
    },
  });
}
```

---

## Performance Monitoring

### Key Metrics to Track

1. **Response Time**
   - P50, P95, P99 latency
   - By endpoint
   - By operation type (read/write)

2. **Database Performance**
   - Query execution time
   - Connection pool usage
   - Slow query log

3. **Cache Performance**
   - Hit rate
   - Miss rate
   - Stale-while-revalidate usage

4. **Memory Usage**
   - Heap size
   - Memory leaks
   - Garbage collection frequency

5. **Network Performance**
   - Payload sizes
   - Compression ratio
   - Bandwidth usage

### Monitoring Setup

```typescript
// lib/performance.ts
export class PerformanceMonitor {
  static async measureEndpoint<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;

      logger.info('Endpoint performance', {
        endpoint: name,
        duration: `${duration.toFixed(2)}ms`,
        ...metadata,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      logger.error('Endpoint error', {
        endpoint: name,
        duration: `${duration.toFixed(2)}ms`,
        error,
        ...metadata,
      });
      throw error;
    }
  }
}
```

---

## Implementation Priorities

### Phase 1: Critical Performance Fixes (High Impact, 4-8 hours)

1. ✅ **Add caching headers to static endpoints**
   - `GET /api/labels` - Immutable
   - `GET /api/hardware/config` - Semi-static
   - `GET /api/measurements/[id]` (completed) - Immutable
   - **Files:** ~5 API routes
   - **Impact:** 50-90% reduction in repeated requests

2. ✅ **Implement pagination for measurements**
   - `GET /api/measurements` - Cursor-based
   - `GET /api/measurements/[id]/readings` - Offset-based
   - **Files:** 2 API routes
   - **Impact:** Handle 10,000+ measurements efficiently

3. ✅ **Implement pagination for sensor readings**
   - `GET /api/sensor-readings` - Offset-based
   - **Files:** 1 API route
   - **Impact:** Handle millions of readings

### Phase 2: Enhanced Performance (Medium Impact, 6-10 hours)

1. ⏳ **Add ETag support for conditional requests**
   - `GET /api/test-objects`
   - `GET /api/sensors`
   - **Files:** ~3 API routes
   - **Impact:** 304 Not Modified responses

2. ⏳ **Implement streaming for large exports**
   - `GET /api/measurements/[id]/export`
   - Chunked JSON streaming
   - **Files:** 1-2 new routes
   - **Impact:** Support GB-sized exports

3. ⏳ **Add selective field loading**
   - Update all `findMany` queries with `select`
   - **Files:** ~10 API routes
   - **Impact:** 30-50% payload reduction

### Phase 3: Advanced Optimizations (Lower Impact, 8-16 hours)

1. ⏳ **Implement SSE for real-time sensor data**
   - `GET /api/sensor-readings/stream`
   - Real-time updates via Server-Sent Events
   - **Files:** 1 new route + client hook
   - **Impact:** Real-time monitoring without polling

2. ⏳ **Add request deduplication**
   - Implement SWR or React Query
   - Client-side caching layer
   - **Files:** New hooks folder
   - **Impact:** Reduced redundant requests

3. ⏳ **Optimize database connection pooling**
   - Tune pool size
   - Add connection timeout settings
   - **Files:** prisma schema, .env
   - **Impact:** Better resource usage

---

## Testing Performance

### Load Testing

```bash
# Install k6 for load testing
npm install -g k6

# Test script
cat > load-test.js << EOF
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 10, // 10 virtual users
  duration: '30s',
};

export default function () {
  const res = http.get('http://localhost:3000/api/measurements');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
}
EOF

# Run test
k6 run load-test.js
```

### Benchmarking

```typescript
// benchmark.ts
import { performance } from 'perf_hooks';

async function benchmarkEndpoint(url: string, iterations = 100) {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fetch(url);
    const duration = performance.now() - start;
    times.push(duration);
  }

  times.sort((a, b) => a - b);

  return {
    min: times[0],
    max: times[times.length - 1],
    mean: times.reduce((a, b) => a + b) / times.length,
    p50: times[Math.floor(times.length * 0.5)],
    p95: times[Math.floor(times.length * 0.95)],
    p99: times[Math.floor(times.length * 0.99)],
  };
}
```

---

## Best Practices

### 1. Always Add Cache Headers

```typescript
// Helper function
export function withCache(
  response: NextResponse,
  options: {
    type: 'immutable' | 'static' | 'semi-static' | 'dynamic' | 'private';
    maxAge?: number;
    etag?: string;
  }
) {
  const headers = new Headers(response.headers);

  switch (options.type) {
    case 'immutable':
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      break;
    case 'static':
      headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
      break;
    case 'semi-static':
      headers.set('Cache-Control', `private, max-age=${options.maxAge || 60}, stale-while-revalidate=300`);
      break;
    case 'dynamic':
      headers.set('Cache-Control', 'private, no-cache, must-revalidate');
      break;
    case 'private':
      headers.set('Cache-Control', 'private, max-age=0, no-store');
      break;
  }

  if (options.etag) {
    headers.set('ETag', options.etag);
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers,
  });
}
```

### 2. Always Paginate Large Datasets

```typescript
// Never do this
const allMeasurements = await prisma.measurement.findMany();

// Always do this
const measurements = await paginateCursor(prisma.measurement, {
  cursor: request.nextUrl.searchParams.get('cursor'),
  limit: 20,
});
```

### 3. Use Streaming for Large Responses

```typescript
// For exports > 10MB, use streaming
if (estimatedSize > 10 * 1024 * 1024) {
  return streamJSONResponse(data);
} else {
  return NextResponse.json(data);
}
```

### 4. Monitor Performance

```typescript
// Wrap all endpoints
export const GET = withAuth(async (request, user) => {
  return PerformanceMonitor.measureEndpoint(
    'GET /api/measurements',
    async () => {
      // Your logic
    },
    { userId: user.userId }
  );
});
```

---

## See Also

- [PERFORMANCE_OPTIMIZATIONS.md](PERFORMANCE_OPTIMIZATIONS.md) - N+1 query fixes
- [DATABASE_INDEXES.md](DATABASE_INDEXES.md) - Database optimization
- [ERROR_HANDLING.md](ERROR_HANDLING.md) - Error handling patterns
- [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md) - Overall migration status
