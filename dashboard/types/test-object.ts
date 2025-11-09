import type { TestObject, Label } from '@prisma/client';

export interface QueryKeys {
  page: string;
  perPage: string;
  sort: string;
  filters: string;
  joinOperator: string;
}

// Prisma type with relations for API responses
export type TestObjectWithLabels = TestObject & {
  labels: Label[];
  pictures?: Array<{ id: string; url: string; order: number }>;
};

// For backward compatibility
export type TestObjectWithLabel = TestObjectWithLabels;

// Transformed type for table display
export interface TestObjectsTableData {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  labels: Array<{ id: string; name: string; color: string | null }>; // Multiple labels
  thumbnailUrl: string | null; // URL of the first image, or null if no images
  images: Array<{ id: string; url: string; order: number }>; // All images for carousel
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
