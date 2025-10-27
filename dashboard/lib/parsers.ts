import {
  createParser,
  parseAsArrayOf,
  parseAsString,
  type ParserBuilder,
} from 'nuqs';
import { z } from 'zod';
import type { ExtendedColumnSort } from '@/types/data-table';

export const filterItemSchema = z.object({
  id: z.string(),
  value: z.unknown(),
  operator: z.string().optional(),
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

export function getFiltersStateParser(
  columnIds: Set<string>
): ParserBuilder<FilterSchema> {
  return createParser({
    parse: (value) => {
      if (!value) {
        return { items: [] };
      }

      try {
        const parsed = JSON.parse(value);
        const result = filterSchema.safeParse(parsed);

        if (!result.success) {
          return { items: [] };
        }

        // Filter out items with invalid column IDs
        const validItems = result.data.items.filter((item) =>
          columnIds.has(item.id)
        );

        return {
          items: validItems,
          joinOperator: result.data.joinOperator,
        };
      } catch {
        return { items: [] };
      }
    },
    serialize: (value) => {
      if (!value || value.items.length === 0) return '';

      return JSON.stringify({
        items: value.items,
        ...(value.joinOperator && { joinOperator: value.joinOperator }),
      });
    },
  }) as ParserBuilder<FilterSchema>;
}
