import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from 'nuqs/server';

export const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: parseAsString,
  filters: parseAsString,
  joinOperator: parseAsString,
});
