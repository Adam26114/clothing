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
  GripVerticalIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react';

import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
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
import { cn } from '@workspace/ui/lib/utils';

import { t } from '@workspace/lib/i18n';

const STORAGE_KEY_PREFIX = 'khit:datatable:cols:';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

const DRAG_COLUMN_ID = '__drag_handle__';

const DRAG_LABEL_KEY = 'admin.common.dragToReorder';

interface SortableItemContextValue {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners | undefined;
}

const SortableItemContext = React.createContext<SortableItemContextValue | null>(null);

function useSortableItemContext(): SortableItemContextValue | null {
  return React.useContext(SortableItemContext);
}

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
  emptyState?: React.ReactNode;
  bulkActions?: (selected: T[]) => React.ReactNode;
  defaultPageSize?: number;
  tableId: string;
  globalSearchPlaceholder?: string;
  getSearchableText?: (row: T) => string;
  getRowId?: (row: T, index: number) => string;
  toolbarTitle?: string;
  toolbarDescription?: string;
  toolbarActions?: React.ReactNode;
  toolbarFilters?: React.ReactNode;
  toolbarSummary?: React.ReactNode;
  enableRowReorder?: boolean;
  onReorder?: (oldIndex: number, newIndex: number, rows: T[]) => void;
  hideToolbarHeader?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyTitle,
  emptyDescription,
  emptyAction,
  emptyState,
  bulkActions,
  defaultPageSize = 20,
  tableId,
  globalSearchPlaceholder,
  getSearchableText,
  getRowId,
  toolbarTitle,
  toolbarDescription,
  toolbarActions,
  toolbarFilters,
  toolbarSummary,
  enableRowReorder = false,
  onReorder,
  hideToolbarHeader = false,
}: DataTableProps<T>): React.JSX.Element {
  const [tableData, setTableData] = React.useState<T[]>(data);
  const prevDataRef = React.useRef<T[]>(data);

  React.useEffect(() => {
    if (prevDataRef.current !== data) {
      prevDataRef.current = data;
      setTableData(data);
    }
  }, [data]);

  const idOf = React.useCallback(
    (item: T, index: number): string => (getRowId ? getRowId(item, index) : String(index)),
    [getRowId]
  );

  const effectiveColumns = React.useMemo<ColumnDef<T, unknown>[]>(() => {
    if (!enableRowReorder) {
      return columns;
    }
    const dragColumn: ColumnDef<T, unknown> = {
      id: DRAG_COLUMN_ID,
      header: () => <span className="sr-only">{t(DRAG_LABEL_KEY)}</span>,
      cell: ({ row }) => <DragHandle id={row.id} />,
      size: 36,
      enableSorting: false,
      enableHiding: false,
    };
    return [dragColumn, ...columns];
  }, [columns, enableRowReorder]);

  const { table } = useDataTable<T>({
    data: tableData,
    columns: effectiveColumns,
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
      return tableData;
    }
    const needle = debouncedSearch.toLowerCase();
    return tableData.filter((row) => {
      if (getSearchableText) {
        return getSearchableText(row).toLowerCase().includes(needle);
      }
      try {
        return JSON.stringify(row).toLowerCase().includes(needle);
      } catch {
        return false;
      }
    });
  }, [tableData, debouncedSearch, getSearchableText]);

  const idIndexMap = React.useMemo(() => {
    const map = new Map<string, number>();
    tableData.forEach((item, index) => {
      map.set(idOf(item, index), index);
    });
    return map;
  }, [tableData, idOf]);

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }
      const oldIndex = idIndexMap.get(String(active.id));
      const newIndex = idIndexMap.get(String(over.id));
      if (oldIndex === undefined || newIndex === undefined) {
        return;
      }
      // Compute the new order from the closure's `tableData` and call
      // `onReorder` *outside* the `setTableData` updater. React invokes the
      // updater during reconciliation; calling a parent setState (via
      // `onReorder` → `useStoredRowOrder.reorder` → `setSavedIds`) from
      // inside the updater triggers "Cannot update a component
      // (`ProductsTableClient`) while rendering a different component
      // (`DataTable`)".
      const next = arrayMove(tableData, oldIndex, newIndex);
      onReorder?.(oldIndex, newIndex, next);
      setTableData(next);
    },
    [idIndexMap, onReorder, tableData]
  );

  const sortableItems = React.useMemo<UniqueIdentifier[]>(() => {
    return table.getRowModel().rows.map((row) => row.id);
  }, [table]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (isLoading) {
    return <DataTableSkeleton columnCount={effectiveColumns.length} rowCount={defaultPageSize} />;
  }

  const selectedRows = table.getFilteredSelectedRowModel().rows.map((row: Row<T>) => row.original);
  const hasSelection = selectedRows.length > 0;
  const activeColumnFilters = table.getState().columnFilters;

  if (filteredData.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {!hideToolbarHeader && toolbarTitle ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold tracking-tight">{toolbarTitle}</h2>
              {toolbarDescription ? (
                <p className="text-muted-foreground text-sm">{toolbarDescription}</p>
              ) : null}
            </div>
            {toolbarActions ? (
              <div className="flex flex-wrap items-center gap-2">{toolbarActions}</div>
            ) : null}
          </div>
        ) : null}
        <DataTableToolbar>
          {globalSearchPlaceholder ? (
            <SearchInput
              value={globalSearch}
              onChange={setGlobalSearch}
              placeholder={globalSearchPlaceholder}
            />
          ) : null}
          {toolbarFilters}
          <ColumnVisibilityMenu table={table} />
        </DataTableToolbar>
        {toolbarSummary ? (
          <div className="text-muted-foreground text-sm tabular-nums">{toolbarSummary}</div>
        ) : null}
        {emptyState ?? (
          <EmptyState
            title={emptyTitle ?? 'No results'}
            description={emptyDescription}
            action={emptyAction}
          />
        )}
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
      {!hideToolbarHeader && toolbarTitle ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold tracking-tight">{toolbarTitle}</h2>
            {toolbarDescription ? (
              <p className="text-muted-foreground text-sm">{toolbarDescription}</p>
            ) : null}
          </div>
          {toolbarActions ? (
            <div className="flex flex-wrap items-center gap-2">{toolbarActions}</div>
          ) : null}
        </div>
      ) : null}

      <DataTableToolbar>
        {globalSearchPlaceholder ? (
          <SearchInput
            value={globalSearch}
            onChange={setGlobalSearch}
            placeholder={globalSearchPlaceholder}
          />
        ) : null}
        {toolbarFilters}
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

      {toolbarSummary ? (
        <div className="text-muted-foreground text-sm tabular-nums">{toolbarSummary}</div>
      ) : null}

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
        {enableRowReorder ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
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
                    <DraggableRow key={row.id} row={row}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </DraggableRow>
                  ))}
                </TableBody>
              </UITable>
            </SortableContext>
          </DndContext>
        ) : (
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
                <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </UITable>
        )}
      </div>

      <DataTablePagination table={table} hideCount={toolbarSummary !== undefined} />
    </div>
  );
}

export function DragHandle<T extends string | number>({ id }: { id: T }): React.JSX.Element {
  const ctx = useSortableItemContext();
  const ariaLabel = t(DRAG_LABEL_KEY);
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      data-drag-id={String(id)}
      aria-label={ariaLabel}
      className="text-muted-foreground hover:bg-muted size-7 cursor-grab active:cursor-grabbing"
      {...(ctx?.attributes ?? {})}
      {...(ctx?.listeners ?? {})}
    >
      <GripVerticalIcon className="size-4" aria-hidden />
      <span className="sr-only">{ariaLabel}</span>
    </Button>
  );
}

export function DraggableRow<T>({
  row,
  children,
}: {
  row: Row<T>;
  children: React.ReactNode;
}): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <SortableItemContext.Provider value={{ attributes, listeners }}>
      <tr
        ref={setNodeRef as unknown as React.Ref<HTMLTableRowElement>}
        data-slot="table-row"
        style={style}
        data-dragging={isDragging || undefined}
        data-state={row.getIsSelected() ? 'selected' : undefined}
        className={cn(
          'hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors',
          isDragging && 'z-10 opacity-80'
        )}
      >
        {children}
      </tr>
    </SortableItemContext.Provider>
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
          <Button type="button" variant="outline" size="sm" className="ms-auto cursor-pointer" />
        }
      >
        <Columns3Icon aria-hidden />
        <span>Columns</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
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
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DataTablePagination<T>({ table, hideCount }: { table: Table<T>; hideCount?: boolean }) {
  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const totalRows = table.getFilteredRowModel().rows.length;
  const canPrev = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {hideCount ? null : (
        <div className="text-muted-foreground text-sm tabular-nums">
          {selectedCount > 0
            ? `${selectedCount} of ${totalRows} row(s) selected.`
            : `${totalRows} row(s).`}
        </div>
      )}
      <div className={cn('flex flex-wrap items-center gap-4', hideCount && 'sm:ms-auto')}>
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
