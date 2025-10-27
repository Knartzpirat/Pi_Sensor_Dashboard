export interface TestObject {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  labelId: string | null;
  label?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
}

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

export interface GetTestObjectsParams {
  page?: number;
  perPage?: number;
  sort?: string | null;
  filters?: unknown;
  joinOperator?: string | null;
}
