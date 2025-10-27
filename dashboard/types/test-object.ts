import type { TestObject, Label } from '@prisma/client';

// Prisma type with relations for API responses
export type TestObjectWithLabel = TestObject & {
  label: Label | null;
};

// Transformed type for table display
export interface TestObjectsTableData {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  labelId: string | null;
  label: string | null;
  labelColor: string | null;
}

// Query parameters for fetching test objects
export interface GetTestObjectsParams {
  page?: number;
  perPage?: number;
  sort?: string | null;
  filters?: unknown;
  joinOperator?: string | null;
}

// Re-export Prisma types for convenience
export type { TestObject, Label };
