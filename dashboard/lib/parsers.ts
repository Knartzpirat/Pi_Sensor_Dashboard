import {
  createParser,
  parseAsArrayOf,
  parseAsString,
  type ParserBuilder,
} from 'nuqs';
import { z } from 'zod';
import { dataTableConfig } from '@/config/data-table';
import type { ExtendedColumnSort, ExtendedColumnFilter } from '@/types/data-table';

export const filterItemSchema = z.object({
  id: z.string(),
  value: z.union([z.string(), z.array(z.string())]),
  variant: z.enum(dataTableConfig.filterVariants),
  operator: z.enum(dataTableConfig.operators),
  filterId: z.string(),
});

export type FilterItemSchema = z.infer<typeof filterItemSchema>;

export const filterSchema = z.object({
  items: z.array(filterItemSchema),
  joinOperator: z.enum(['and', 'or']).optional(),
});

export type FilterSchema = z.infer<typeof filterSchema>;

export function getSortingStateParser<TData>(
  columnIds: Set<string>
): ParserBuilder<ExtendedColumnSort<TData>[]> {
  return createParser({
    parse: (value) => {
      if (!value) return [];

      const parts = value.split(',');
      const sorting: ExtendedColumnSort<TData>[] = [];

      for (const part of parts) {
        const match = part.match(/^(.+)\.(asc|desc)$/);
        if (match) {
          const [, id, order] = match;
          if (columnIds.has(id)) {
            sorting.push({
              id: id as Extract<keyof TData, string>,
              desc: order === 'desc',
            });
          }
        }
      }

      return sorting;
    },
    serialize: (value) => {
      if (!value || value.length === 0) return '';

      return value
        .map((sort) => `${String(sort.id)}.${sort.desc ? 'desc' : 'asc'}`)
        .join(',');
    },
  });
}

export const searchParamsParser = {
  page: parseAsString.withDefault('1'),
  perPage: parseAsString.withDefault('10'),
  sort: parseAsString,
  filters: parseAsString,
  joinOperator: parseAsString,
};

export function getValidFilters(filters: unknown): FilterItemSchema[] {
  if (!filters) return [];

  try {
    if (typeof filters === 'string') {
      const parsed = JSON.parse(filters);
      const result = z.array(filterItemSchema).safeParse(parsed);
      return result.success ? result.data : [];
    }

    const result = z.array(filterItemSchema).safeParse(filters);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

export function getFiltersStateParser<TData>(
  columnIds: string[] | Set<string>
): ParserBuilder<ExtendedColumnFilter<TData>[]> {
  const validKeys = columnIds instanceof Set ? columnIds : new Set(columnIds);

  return createParser({
    parse: (value) => {
      if (!value) return null;

      try {
        const parsed = JSON.parse(value);
        const result = z.array(filterItemSchema).safeParse(parsed);

        if (!result.success) return null;

        if (result.data.some((item) => !validKeys.has(item.id))) {
          return null;
        }

        return result.data as ExtendedColumnFilter<TData>[];
      } catch {
        return null;
      }
    },
    serialize: (value) => JSON.stringify(value),
    eq: (a, b) =>
      a.length === b.length &&
      a.every(
        (filter, index) =>
          filter.id === b[index]?.id &&
          filter.value === b[index]?.value &&
          filter.variant === b[index]?.variant &&
          filter.operator === b[index]?.operator,
      ),
  });
}
