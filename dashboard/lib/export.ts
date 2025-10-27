import type { Table } from '@tanstack/react-table';

interface ExportTableToCsvOptions {
  filename?: string;
  excludeColumns?: string[];
}

export function exportTableToCSV<TData>(
  table: Table<TData>,
  options: ExportTableToCsvOptions = {}
): void {
  const { filename = 'table', excludeColumns = [] } = options;

  // Get visible columns
  const columns = table
    .getAllColumns()
    .filter(
      (column) => column.getIsVisible() && !excludeColumns.includes(column.id)
    );

  // Get rows
  const rows = table.getFilteredRowModel().rows;

  // Create CSV header
  const header = columns
    .map((column) => {
      const columnDef = column.columnDef;
      const headerValue =
        typeof columnDef.header === 'string' ? columnDef.header : column.id;
      return `"${String(headerValue).replace(/"/g, '""')}"`;
    })
    .join(',');

  // Create CSV rows
  const csvRows = rows.map((row) => {
    return columns
      .map((column) => {
        const cellValue = row.getValue(column.id);
        let value = '';

        if (cellValue instanceof Date) {
          value = cellValue.toISOString();
        } else if (cellValue != null) {
          value = String(cellValue);
        }

        return `"${value.replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  // Combine header and rows
  const csv = [header, ...csvRows].join('\n');

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
