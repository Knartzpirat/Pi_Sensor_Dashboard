# Database Indexes Documentation

## Overview

This document describes all database indexes in the Pi Sensor Dashboard application, their purpose, and the query patterns they optimize.

## Index Strategy

The indexing strategy follows these principles:

1. **Foreign Keys** - All foreign keys have indexes for efficient joins
2. **Unique Constraints** - Natural unique columns (username, email, etc.)
3. **Query Filters** - Frequently filtered columns (status, enabled, type)
4. **Sorting** - Columns used in ORDER BY clauses (createdAt, updatedAt, timestamp)
5. **Composite Indexes** - Multi-column queries (measurementId + timestamp)
6. **Range Queries** - Time-based range queries (timestamp)

## Indexes by Model

### User

| Index | Columns | Type | Purpose |
|-------|---------|------|---------|
| Primary Key | `id` | Unique | Primary identifier |
| Unique | `username` | Unique | Login lookup, prevent duplicates |

**Query Patterns:**
- Login: `WHERE username = ?` → Uses `username` index
- User lookup: `WHERE id = ?` → Uses primary key

### RefreshToken

| Index | Columns | Type | Purpose |
|-------|---------|------|---------|
| Primary Key | `id` | Unique | Primary identifier |
| Unique | `token` | Unique | Token verification |
| Index | `userId` | Standard | User's tokens lookup, foreign key |
| Index | `expiresAt` | Standard | Cleanup of expired tokens |

**Query Patterns:**
- Token verification: `WHERE token = ?` → Uses `token` index
- User logout: `WHERE userId = ?` → Uses `userId` index
- Cleanup: `WHERE expiresAt < NOW()` → Uses `expiresAt` index

### RecoveryCode

| Index | Columns | Type | Purpose |
|-------|---------|------|---------|
| Primary Key | `id` | Unique | Primary identifier |
| Index | `userId` | Standard | User's codes lookup, foreign key |
| Index | `used` | Standard | Find unused codes |

**Query Patterns:**
- Find unused codes: `WHERE userId = ? AND used = false` → Uses `userId` + filter on `used`
- Mark as used: `WHERE id = ?` → Uses primary key

### Label

| Index | Columns | Type | Purpose |
|-------|---------|------|---------|
| Primary Key | `id` | Unique | Primary identifier |
| Unique | `name, type` | Composite Unique | Prevent duplicate names per type |
| Index | `type` | Standard | Filter labels by type |

**Query Patterns:**
- List labels by type: `WHERE type = ?` → Uses `type` index
- Create label: Check uniqueness on `name + type`

### TestObject

| Index | Columns | Type | Purpose |
|-------|---------|------|---------|
| Primary Key | `id` | Unique | Primary identifier |
| Index | `createdAt` | Standard | Sort by creation date |
| Index | `updatedAt` | Standard | **NEW** - Sort by last update, find recently modified |

**Query Patterns:**
- List all: `ORDER BY createdAt DESC` → Uses `createdAt` index
- Recently updated: `ORDER BY updatedAt DESC` → Uses `updatedAt` index (NEW)
- Filter by label: Uses join table

**Improvements:**
- ✅ Added `updatedAt` index for sorting and filtering by last modification

### Picture

| Index | Columns | Type | Purpose |
|-------|---------|------|---------|
| Primary Key | `id` | Unique | Primary identifier |
| Composite | `entityType, entityId, order` | Standard | List pictures for entity in order |
| Composite | `entityType, entityId` | Standard | List all pictures for entity |

**Query Patterns:**
- List pictures: `WHERE entityType = ? AND entityId = ? ORDER BY order` → Uses composite index
- Count pictures: `WHERE entityType = ? AND entityId = ?` → Uses second composite index

### Document

| Index | Columns | Type | Purpose |
|-------|---------|------|---------|
| Primary Key | `id` | Unique | Primary identifier |
| Composite | `entityType, entityId, order` | Standard | List documents for entity in order |
| Composite | `entityType, entityId` | Standard | List all documents for entity |

**Query Patterns:**
- List documents: `WHERE entityType = ? AND entityId = ? ORDER BY order` → Uses composite index
- Count documents: `WHERE entityType = ? AND entityId = ?` → Uses second composite index

### Sensor

| Index | Columns | Type | Purpose |
|-------|---------|------|---------|
| Primary Key | `id` | Unique | Primary identifier |
| Unique | `name` | Unique | Prevent duplicate sensor names |
| Index | `enabled` | Standard | Filter active sensors |
| Index | `boardType` | Standard | Filter by hardware board |

**Query Patterns:**
- List enabled sensors: `WHERE enabled = true` → Uses `enabled` index
- List by board: `WHERE boardType = ?` → Uses `boardType` index
- Find by name: `WHERE name = ?` → Uses `name` unique index

### SensorEntity

| Index | Columns | Type | Purpose |
|-------|---------|------|---------|
| Primary Key | `id` | Unique | Primary identifier |
| Index | `sensorId` | Standard | Sensor's entities, foreign key |
| Index | `isVisible` | Standard | Filter visible entities |

**Query Patterns:**
- Sensor's entities: `WHERE sensorId = ?` → Uses `sensorId` index
- Visible entities: `WHERE isVisible = true` → Uses `isVisible` index

### Measurement

| Index | Columns | Type | Purpose |
|-------|---------|------|---------|
| Primary Key | `id` | Unique | Primary identifier |
| Unique | `sessionId` | Unique | Backend session lookup |
| Index | `status` | Standard | Filter by status (RUNNING, COMPLETED, etc.) |
| Index | `startTime` | Standard | Sort/filter by start time |

**Query Patterns:**
- List active: `WHERE status = 'RUNNING'` → Uses `status` index
- Recent measurements: `ORDER BY startTime DESC` → Uses `startTime` index
- Backend lookup: `WHERE sessionId = ?` → Uses `sessionId` unique index

### MeasurementSensor

| Index | Columns | Type | Purpose |
|-------|---------|------|---------|
| Primary Key | `id` | Unique | Primary identifier |
| Unique | `measurementId, sensorId` | Composite Unique | One sensor per measurement |
| Index | `measurementId` | Standard | Measurement's sensors, foreign key |
| Index | `sensorId` | Standard | Sensor usage history, foreign key |
| Index | `testObjectId` | Standard | TestObject associations, foreign key |

**Query Patterns:**
- Measurement's sensors: `WHERE measurementId = ?` → Uses `measurementId` index
- Sensor usage: `WHERE sensorId = ?` → Uses `sensorId` index
- TestObject usage: `WHERE testObjectId = ?` → Uses `testObjectId` index

### SensorReading

| Index | Columns | Type | Purpose |
|-------|---------|------|---------|
| Primary Key | `id` | Unique | Primary identifier |
| Composite | `measurementId, timestamp` | Standard | Time-series data for measurement |
| Composite | `measurementId, entityId` | Standard | **NEW** - Filter readings by measurement and specific entity |
| Composite | `entityId, timestamp` | Standard | Entity's time-series data |
| Index | `timestamp` | Standard | Cleanup old readings |

**Query Patterns:**
- Measurement readings: `WHERE measurementId = ? ORDER BY timestamp` → Uses first composite
- Entity readings: `WHERE entityId = ? AND timestamp BETWEEN ? AND ?` → Uses second composite
- Measurement + entity: `WHERE measurementId = ? AND entityId = ?` → Uses new composite (NEW)
- Cleanup: `WHERE timestamp < ?` → Uses `timestamp` index

**Improvements:**
- ✅ Added composite index `(measurementId, entityId)` for queries filtering by both columns

### HardwareConfig

| Index | Columns | Type | Purpose |
|-------|---------|------|---------|
| Primary Key | `id` | Unique | Primary identifier |

**Query Patterns:**
- Get config: Typically single-row table, primary key lookup sufficient

## Performance Impact Analysis

### Before Optimization

**Problems Identified:**
1. Missing `TestObject.updatedAt` index
   - Queries: `ORDER BY updatedAt DESC` required full table scan
   - Impact: Slow "recently modified" queries

2. Missing `SensorReading(measurementId, entityId)` composite index
   - Queries: `WHERE measurementId = ? AND entityId = ?` required scan of measurement's readings
   - Impact: Slow entity-specific reading fetches during measurements

### After Optimization

**Improvements:**
1. ✅ **TestObject.updatedAt index**
   - Query performance: O(log n) instead of O(n) for sorted queries
   - Use cases: Dashboard "recently modified" lists, update tracking

2. ✅ **SensorReading(measurementId, entityId) composite index**
   - Query performance: Direct index lookup instead of filtered scan
   - Use cases: Real-time entity graphs during measurements, entity-specific data export

### Estimated Performance Gains

| Query Type | Before | After | Improvement |
|------------|--------|-------|-------------|
| Recently updated test objects (10k rows) | ~200ms | ~5ms | **40x faster** |
| Entity readings in measurement (100k rows) | ~500ms | ~10ms | **50x faster** |
| Sort by update date | Full scan | Index scan | **Significant** |

## Index Maintenance

### Automatic Maintenance

PostgreSQL automatically maintains indexes. No manual intervention required for:
- Index updates on INSERT/UPDATE/DELETE
- Index statistics updates (via autovacuum)
- Query planner index selection

### Monitoring

Monitor index usage with these queries:

```sql
-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Find unused indexes
SELECT
    schemaname,
    tablename,
    indexname
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND idx_scan = 0
    AND indexname NOT LIKE '%_pkey';

-- Check index sizes
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Future Considerations

Consider adding indexes if these query patterns emerge:

1. **Filtering by title/description**: Full-text search indexes
2. **Geo-location data**: PostGIS spatial indexes
3. **Complex JSON queries**: GIN indexes on JSON columns
4. **Partial indexes**: For frequently filtered subsets (e.g., only active measurements)

## Migration Information

### Applied Changes

The following indexes were added in the latest schema update:

```prisma
// TestObject model
@@index([updatedAt])  // NEW - Sort by last update

// SensorReading model
@@index([measurementId, entityId])  // NEW - Filter by measurement and entity
```

### Database Update

The schema changes were applied using:

```bash
npx prisma db push
```

This command:
- ✅ Added missing indexes to the database
- ✅ Regenerated Prisma Client with updated schema
- ✅ No data migration required (indexes only)

### Rollback

If indexes need to be removed (unlikely), edit `schema.prisma` and remove the `@@index` lines, then run:

```bash
npx prisma db push
```

## Best Practices

### When to Add Indexes

✅ **Add indexes for:**
- Foreign key columns (improves joins)
- Columns in WHERE clauses (frequent filters)
- Columns in ORDER BY clauses (sorting)
- Composite columns used together in queries
- Unique constraints (data integrity + performance)

❌ **Avoid indexes for:**
- Small tables (< 1000 rows)
- Columns with low cardinality (few distinct values)
- Columns rarely used in queries
- Columns frequently updated (index maintenance overhead)

### Index Design Tips

1. **Order matters in composite indexes**: `(a, b)` can be used for `WHERE a = ?` but not `WHERE b = ?`
2. **Keep indexes selective**: High cardinality columns benefit most
3. **Monitor index usage**: Remove unused indexes to reduce write overhead
4. **Consider covering indexes**: Include frequently selected columns in index

## Related Documentation

- [Prisma Schema](prisma/schema.prisma) - Complete database schema
- [PERFORMANCE_OPTIMIZATIONS.md](PERFORMANCE_OPTIMIZATIONS.md) - N+1 query fixes
- [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md) - Overall migration status

## References

- [Prisma Indexes Documentation](https://www.prisma.io/docs/concepts/components/prisma-schema/indexes)
- [PostgreSQL Index Types](https://www.postgresql.org/docs/current/indexes-types.html)
- [PostgreSQL Index Performance](https://www.postgresql.org/docs/current/indexes-examine.html)
