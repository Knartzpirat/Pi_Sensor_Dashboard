import type { Column } from '@tanstack/react-table';
import type { CSSProperties } from 'react';
import { dataTableConfig } from '@/config/data-table';
import type { FilterVariant, FilterOperator } from '@/types/data-table';

export function getCommonPinningStyles<TData>({
  column,
}: {
  column: Column<TData>;
}): CSSProperties {
  const isPinned = column.getIsPinned();
  const isLastLeftPinnedColumn =
    isPinned === 'left' && column.getIsLastColumn('left');
  const isFirstRightPinnedColumn =
    isPinned === 'right' && column.getIsFirstColumn('right');

  return {
    boxShadow: isLastLeftPinnedColumn
      ? '-4px 0 4px -4px hsl(var(--border)) inset'
      : isFirstRightPinnedColumn
      ? '4px 0 4px -4px hsl(var(--border)) inset'
      : undefined,
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    opacity: isPinned ? 0.97 : 1,
    position: isPinned ? 'sticky' : 'relative',
    background: isPinned ? 'hsl(var(--background))' : undefined,
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
  };
}

export function getFilterOperators(
  variant: FilterVariant
): { label: string; value: FilterOperator }[] {
  switch (variant) {
    case 'text':
      return dataTableConfig.textOperators;
    case 'number':
    case 'range':
      return dataTableConfig.numericOperators;
    case 'date':
    case 'dateRange':
      return dataTableConfig.dateOperators;
    case 'select':
      return dataTableConfig.selectOperators;
    case 'multiSelect':
      return dataTableConfig.multiSelectOperators;
    case 'boolean':
      return dataTableConfig.booleanOperators;
    default:
      return dataTableConfig.textOperators;
  }
}

export function getDefaultFilterOperator(variant: FilterVariant): FilterOperator {
  const operators = getFilterOperators(variant);
  return operators[0]?.value ?? 'eq';
}
