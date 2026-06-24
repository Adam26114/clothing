'use client';

import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type Table,
  type VisibilityState,
} from '@tanstack/react-table';

export type { ColumnDef, Row, Table } from '@tanstack/react-table';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Columns3Icon,
  EllipsisVerticalIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react';

import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';

import { DataTableSkeleton } from '@workspace/ui/components/admin/data-table-skeleton';
import { EmptyState } from '@workspace/ui/components/empty-state';

const STORAGE_KEY_PREFIX = 'khit:datatable:cols:';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

interface UseDataTableOptions<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  defaultPageSize?: number;
  tableId: string;
  getRowId?: (row: T, index: number) => string;
}

interface UseDataTableResult<T> {
  table: Table<T>;
}

export function useDataTable<T>({
  data,
  columns,
  defaultPageSize = 20,
  tableId,
  getRowId,
}: UseDataTableOptions<T>): UseDataTableResult<T> {
  const storageKey = `${STORAGE_KEY_PREFIX}${tableId}`;

  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(() => {
    if (typeof window === 'undefined') {
      return {};
    }
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        return {};
      }
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as VisibilityState;
      }
    } catch {
      // ignore
    }
    return {};
  });
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(columnVisibility));
    } catch {
      // ignore
    }
  }, [columnVisibility, storageKey]);

  // TanStack Table's useReactTable returns non-memoizable functions by API contract;
  // downstream consumers must treat `table` as opaque. This is upstream behavior,
  // not a local anti-pattern.
  const table = useReactTable<T>({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    enableRowSelection: true,
    getRowId: getRowId ?? ((_row, index) => String(index)),
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return { table };
}

export interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  bulkActions?: (selected: T[]) => React.ReactNode;
  defaultPageSize?: number;
  tableId: string;
  globalSearchPlaceholder?: string;
  getSearchableText?: (row: T) => string;
  getRowId?: (row: T, index: number) => string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyTitle,
  emptyDescription,
  emptyAction,
  bulkActions,
  defaultPageSize = 20,
  tableId,
  globalSearchPlaceholder,
  getSearchableText,
  getRowId,
}: DataTableProps<T>): React.JSX.Element {
  const { table } = useDataTable<T>({
    data,
    columns,
    defaultPageSize,
    tableId,
    getRowId,
  });

  const [globalSearch, setGlobalSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState(globalSearch);

  React.useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(globalSearch), 300);
    return () => clearTimeout(handle);
  }, [globalSearch]);

  const filteredData = React.useMemo(() => {
    if (!debouncedSearch) {
      return data;
    }
    const needle = debouncedSearch.toLowerCase();
    return data.filter((row) => {
      if (getSearchableText) {
        return getSearchableText(row).toLowerCase().includes(needle);
      }
      try {
        return JSON.stringify(row).toLowerCase().includes(needle);
      } catch {
        return false;
      }
    });
  }, [data, debouncedSearch, getSearchableText]);

  const selectedRows = table
    .getFilteredSelectedRowModel()
    .rows.map((row: Row<T>) => row.original);
  const hasSelection = selectedRows.length > 0;
  const activeColumnFilters = table.getState().columnFilters;

  if (isLoading) {
    return (
      <DataTableSkeleton
        columnCount={columns.length}
        rowCount={defaultPageSize}
      />
    );
  }

  if (filteredData.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <DataTableToolbar>
          {globalSearchPlaceholder ? (
            <SearchInput
              value={globalSearch}
              onChange={setGlobalSearch}
              placeholder={globalSearchPlaceholder}
            />
          ) : null}
          <ColumnVisibilityMenu table={table} />
        </DataTableToolbar>
        <EmptyState
          title={emptyTitle ?? 'No results'}
          description={emptyDescription}
          action={emptyAction}
        />
        {activeColumnFilters.length > 0 ? (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => table.resetColumnFilters()}
              className="cursor-pointer"
            >
              <XIcon className="me-1.5 size-4" aria-hidden />
              Clear filters
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DataTableToolbar>
        {globalSearchPlaceholder ? (
          <SearchInput
            value={globalSearch}
            onChange={setGlobalSearch}
            placeholder={globalSearchPlaceholder}
          />
        ) : null}
        {hasSelection && bulkActions ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-sm tabular-nums">
              {selectedRows.length} selected
            </span>
            {bulkActions(selectedRows)}
          </div>
        ) : null}
        <ColumnVisibilityMenu table={table} />
      </DataTableToolbar>

      {activeColumnFilters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeColumnFilters.map((filter) => {
            const column = table.getColumn(filter.id);
            if (!column) {
              return null;
            }
            const label =
              typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;
            return (
              <Badge key={filter.id} variant="secondary" className="gap-1.5">
                <span className="text-xs">{label}</span>
                <button
                  type="button"
                  onClick={() => column.setFilterValue(undefined)}
                  className="text-muted-foreground hover:text-foreground inline-flex size-4 cursor-pointer items-center justify-center rounded-sm transition-colors"
                  aria-label={`Clear filter: ${label}`}
                >
                  <XIcon className="size-3" aria-hidden />
                </button>
              </Badge>
            );
          })}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => table.resetColumnFilters()}
            className="cursor-pointer"
          >
            <XIcon className="me-1.5 size-4" aria-hidden />
            Clear filters
          </Button>
        </div>
      ) : null}

      <div className="border-border overflow-hidden rounded-lg border">
        <UITable>
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? 'selected' : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </UITable>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}

function DataTableToolbar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
}) {
  const hasValue = value.length > 0;
  return (
    <div className="relative w-full sm:max-w-xs">
      <SearchIcon
        className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2"
        aria-hidden
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-8 w-full ps-8 pe-8"
        aria-label={placeholder}
      />
      {hasValue ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="text-muted-foreground hover:text-foreground absolute end-2 top-1/2 inline-flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm transition-colors"
          aria-label="Clear search"
        >
          <XIcon className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

function ColumnVisibilityMenu<T>({ table }: { table: Table<T> }) {
  const columns = table.getAllColumns().filter((column) => column.getCanHide());
  if (columns.length === 0) {
    return null;
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ms-auto cursor-pointer"
          />
        }
      >
        <Columns3Icon aria-hidden />
        <span>Columns</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => {
          const label =
            typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;
          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              className="cursor-pointer capitalize"
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              {label}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DataTablePagination<T>({ table }: { table: Table<T> }) {
  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const totalRows = table.getFilteredRowModel().rows.length;
  const canPrev = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-muted-foreground text-sm tabular-nums">
        {selectedCount > 0
          ? `${selectedCount} of ${totalRows} row(s) selected.`
          : `${totalRows} row(s).`}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="hidden items-center gap-2 sm:flex">
          <Label htmlFor="rows-per-page" className="text-sm font-medium">
            Rows per page
          </Label>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              const next = Number(value);
              if (Number.isFinite(next)) {
                table.setPageSize(next);
              }
            }}
          >
            <SelectTrigger size="sm" className="w-20 cursor-pointer" id="rows-per-page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)} className="cursor-pointer">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm font-medium tabular-nums">
          Page {pageIndex + 1} of {Math.max(1, pageCount)}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!canPrev}
            aria-label="Go to first page"
            className="cursor-pointer"
          >
            <ChevronsLeftIcon aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => table.previousPage()}
            disabled={!canPrev}
            aria-label="Go to previous page"
            className="cursor-pointer"
          >
            <ChevronLeftIcon aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => table.nextPage()}
            disabled={!canNext}
            aria-label="Go to next page"
            className="cursor-pointer"
          >
            <ChevronRightIcon aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => table.setPageIndex(Math.max(0, pageCount - 1))}
            disabled={!canNext}
            aria-label="Go to last page"
            className="cursor-pointer"
          >
            <ChevronsRightIcon aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface SortableHeaderProps {
  label: string;
  sorted: 'asc' | 'desc' | false;
  onToggle: ((event: unknown) => void) | undefined;
}

export function SortableHeader({ label, sorted, onToggle }: SortableHeaderProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="hover:bg-muted -ms-2 h-7 cursor-pointer gap-1 px-2 font-medium"
    >
      <span>{label}</span>
      {sorted === 'asc' ? (
        <ArrowUpIcon className="text-foreground size-3.5" aria-hidden />
      ) : sorted === 'desc' ? (
        <ArrowDownIcon className="text-foreground size-3.5" aria-hidden />
      ) : (
        <ArrowUpIcon className="text-muted-foreground/40 size-3.5 rtl:rotate-180" aria-hidden />
      )}
    </Button>
  );
}

export function SelectionCheckbox<T>({ table }: { table: Table<T> }) {
  return (
    <div className="flex items-center justify-center">
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="cursor-pointer"
      />
    </div>
  );
}

export function RowCheckbox<T>({ row }: { row: Row<T> }) {
  return (
    <div className="flex items-center justify-center">
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="cursor-pointer"
      />
    </div>
  );
}

interface RowActionsProps {
  children: React.ReactNode;
}

export function RowActions({ children }: RowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            className="text-muted-foreground data-open:bg-muted size-7 cursor-pointer"
          />
        }
      >
        <EllipsisVerticalIcon aria-hidden />
        <span className="sr-only">Open menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
