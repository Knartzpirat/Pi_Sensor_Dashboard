import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
} from 'nuqs/server';

export const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: parseAsString,
  filters: parseAsString,
  joinOperator: parseAsString,
  // Normal mode filters
  title: parseAsString,
  label: parseAsArrayOf(parseAsString),
});
