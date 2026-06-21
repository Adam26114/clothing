'use client';

import { notFound } from 'next/navigation';
import * as React from 'react';
import { CircleCheckIcon, PackageIcon, ShoppingBagIcon } from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { DropdownMenuItem, DropdownMenuSeparator } from '@workspace/ui/components/dropdown-menu';
import {
  DataTable,
  RowActions,
  RowCheckbox,
  SelectionCheckbox,
  SortableHeader,
  type ColumnDef,
} from '@workspace/ui/components/data-table';
import { AdminPageHeader } from '@workspace/ui/components/admin/page-header';
import { DataTableSkeleton } from '@workspace/ui/components/admin/data-table-skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { t } from '@workspace/lib/i18n';

if (process.env.NODE_ENV === 'production') {
  notFound();
}

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface OrderRow {
  _id: string;
  orderNumber: string;
  customer: string;
  email: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

interface ProductRow {
  _id: string;
  name: string;
  sku: string;
  category: string;
  basePrice: number;
  salePrice: number | null;
  totalStock: number;
  isPublished: boolean;
  isFeatured: boolean;
}

interface InventoryRow {
  _id: string;
  productName: string;
  productSlug: string;
  colorName: string;
  colorHex: string;
  size: string;
  stock: number;
  updatedAt: string;
}

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const ORDER_ROWS: OrderRow[] = [
  {
    _id: 'o-001',
    orderNumber: 'KH-1001',
    customer: 'Aye Aye',
    email: 'aye@example.com',
    total: 64000,
    status: 'pending',
    createdAt: '2026-06-19T08:14:00.000Z',
  },
  {
    _id: 'o-002',
    orderNumber: 'KH-1002',
    customer: 'Tun Tun',
    email: 'tun@example.com',
    total: 122000,
    status: 'confirmed',
    createdAt: '2026-06-19T11:42:00.000Z',
  },
  {
    _id: 'o-003',
    orderNumber: 'KH-1003',
    customer: 'Mya Mya',
    email: 'mya@example.com',
    total: 35000,
    status: 'processing',
    createdAt: '2026-06-20T05:11:00.000Z',
  },
  {
    _id: 'o-004',
    orderNumber: 'KH-1004',
    customer: 'Ko Ko',
    email: 'ko@example.com',
    total: 88000,
    status: 'shipped',
    createdAt: '2026-06-20T09:33:00.000Z',
  },
  {
    _id: 'o-005',
    orderNumber: 'KH-1005',
    customer: 'Hla Hla',
    email: 'hla@example.com',
    total: 49000,
    status: 'delivered',
    createdAt: '2026-06-18T15:21:00.000Z',
  },
  {
    _id: 'o-006',
    orderNumber: 'KH-1006',
    customer: 'Mg Mg',
    email: 'mg@example.com',
    total: 167000,
    status: 'cancelled',
    createdAt: '2026-06-17T22:09:00.000Z',
  },
  {
    _id: 'o-007',
    orderNumber: 'KH-1007',
    customer: 'Su Su',
    email: 'su@example.com',
    total: 24000,
    status: 'pending',
    createdAt: '2026-06-21T03:48:00.000Z',
  },
  {
    _id: 'o-008',
    orderNumber: 'KH-1008',
    customer: 'Aung Aung',
    email: 'aung@example.com',
    total: 76000,
    status: 'processing',
    createdAt: '2026-06-21T07:00:00.000Z',
  },
];

const PRODUCT_ROWS: ProductRow[] = [
  {
    _id: 'p-001',
    name: 'Yangon Linen Shirt',
    sku: 'KHT-SH-001',
    category: 'Men',
    basePrice: 32000,
    salePrice: 28000,
    totalStock: 24,
    isPublished: true,
    isFeatured: true,
  },
  {
    _id: 'p-002',
    name: 'Inle Cotton Dress',
    sku: 'KHT-DR-002',
    category: 'Women',
    basePrice: 45000,
    salePrice: null,
    totalStock: 12,
    isPublished: true,
    isFeatured: false,
  },
  {
    _id: 'p-003',
    name: 'Bagan Wide Trouser',
    sku: 'KHT-TR-003',
    category: 'Women',
    basePrice: 38000,
    salePrice: 32000,
    totalStock: 0,
    isPublished: true,
    isFeatured: true,
  },
  {
    _id: 'p-004',
    name: 'Mandalay Tee',
    sku: 'KHT-TS-004',
    category: 'Men',
    basePrice: 18000,
    salePrice: null,
    totalStock: 56,
    isPublished: false,
    isFeatured: false,
  },
  {
    _id: 'p-005',
    name: 'Shan Wrap Skirt',
    sku: 'KHT-SK-005',
    category: 'Women',
    basePrice: 42000,
    salePrice: 42000,
    totalStock: 6,
    isPublished: true,
    isFeatured: false,
  },
  {
    _id: 'p-006',
    name: 'Naypyidaw Jacket',
    sku: 'KHT-JK-006',
    category: 'Men',
    basePrice: 78000,
    salePrice: 65000,
    totalStock: 18,
    isPublished: true,
    isFeatured: true,
  },
  {
    _id: 'p-007',
    name: 'Mrauk-U Embroidered Blouse',
    sku: 'KHT-BL-007',
    category: 'Women',
    basePrice: 52000,
    salePrice: null,
    totalStock: 9,
    isPublished: true,
    isFeatured: false,
  },
];

const INVENTORY_ROWS: InventoryRow[] = [
  {
    _id: 'i-001',
    productName: 'Yangon Linen Shirt',
    productSlug: 'yangon-linen-shirt',
    colorName: 'Ivory',
    colorHex: '#F4F1EA',
    size: 'S',
    stock: 4,
    updatedAt: '2026-06-20T09:33:00.000Z',
  },
  {
    _id: 'i-002',
    productName: 'Yangon Linen Shirt',
    productSlug: 'yangon-linen-shirt',
    colorName: 'Ivory',
    colorHex: '#F4F1EA',
    size: 'M',
    stock: 12,
    updatedAt: '2026-06-20T09:33:00.000Z',
  },
  {
    _id: 'i-003',
    productName: 'Inle Cotton Dress',
    productSlug: 'inle-cotton-dress',
    colorName: 'Indigo',
    colorHex: '#3A4A6B',
    size: 'M',
    stock: 0,
    updatedAt: '2026-06-21T03:11:00.000Z',
  },
  {
    _id: 'i-004',
    productName: 'Bagan Wide Trouser',
    productSlug: 'bagan-wide-trouser',
    colorName: 'Sand',
    colorHex: '#D9C7A7',
    size: 'L',
    stock: 3,
    updatedAt: '2026-06-19T18:22:00.000Z',
  },
  {
    _id: 'i-005',
    productName: 'Mandalay Tee',
    productSlug: 'mandalay-tee',
    colorName: 'Black',
    colorHex: '#1A1A1A',
    size: 'M',
    stock: 28,
    updatedAt: '2026-06-18T07:00:00.000Z',
  },
  {
    _id: 'i-006',
    productName: 'Shan Wrap Skirt',
    productSlug: 'shan-wrap-skirt',
    colorName: 'Teal',
    colorHex: '#0E6B6B',
    size: 'S',
    stock: 2,
    updatedAt: '2026-06-21T05:48:00.000Z',
  },
  {
    _id: 'i-007',
    productName: 'Naypyidaw Jacket',
    productSlug: 'naypyidaw-jacket',
    colorName: 'Olive',
    colorHex: '#5B6A3A',
    size: 'L',
    stock: 6,
    updatedAt: '2026-06-20T11:01:00.000Z',
  },
  {
    _id: 'i-008',
    productName: 'Mrauk-U Embroidered Blouse',
    productSlug: 'mrauk-u-embroidered-blouse',
    colorName: 'Crimson',
    colorHex: '#9B1C2E',
    size: 'M',
    stock: 5,
    updatedAt: '2026-06-21T01:12:00.000Z',
  },
];

function formatMMK(amount: number): string {
  return `${amount.toLocaleString('en-US')} Ks`;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const showCheck = status === 'shipped' || status === 'delivered';
  if (status === 'pending') {
    return (
      <Badge variant="secondary" className="cursor-default">
        {ORDER_STATUS_LABEL[status]}
      </Badge>
    );
  }
  if (status === 'cancelled') {
    return (
      <Badge variant="destructive" className="cursor-default">
        {ORDER_STATUS_LABEL[status]}
      </Badge>
    );
  }
  if (status === 'processing') {
    return (
      <Badge variant="outline" className="cursor-default">
        {ORDER_STATUS_LABEL[status]}
      </Badge>
    );
  }
  if (showCheck) {
    return (
      <Badge
        variant={status === 'delivered' ? 'outline' : 'default'}
        className="cursor-default gap-1"
      >
        <CircleCheckIcon className="fill-primary text-primary" aria-hidden />
        {ORDER_STATUS_LABEL[status]}
      </Badge>
    );
  }
  return (
    <Badge variant="default" className="cursor-default">
      {ORDER_STATUS_LABEL[status]}
    </Badge>
  );
}

const ORDER_COLUMNS: ColumnDef<OrderRow, unknown>[] = [
  {
    id: 'select',
    header: ({ table }) => <SelectionCheckbox table={table} />,
    cell: ({ row }) => <RowCheckbox row={row} />,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'orderNumber',
    header: ({ column }) => (
      <SortableHeader
        label="Order #"
        sorted={column.getIsSorted()}
        onToggle={column.getToggleSortingHandler()}
      />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-sm tabular-nums">{row.original.orderNumber}</span>
    ),
  },
  {
    accessorKey: 'customer',
    header: ({ column }) => (
      <SortableHeader
        label="Customer"
        sorted={column.getIsSorted()}
        onToggle={column.getToggleSortingHandler()}
      />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.customer}</span>
        <span className="text-muted-foreground text-xs">{row.original.email}</span>
      </div>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <SortableHeader
        label="Placed"
        sorted={column.getIsSorted()}
        onToggle={column.getToggleSortingHandler()}
      />
    ),
    cell: ({ row }) => <span className="tabular-nums">{formatDate(row.original.createdAt)}</span>,
  },
  {
    accessorKey: 'total',
    header: () => <div className="text-end">Total</div>,
    cell: ({ row }) => (
      <div className="text-end font-medium tabular-nums">{formatMMK(row.original.total)}</div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: 'actions',
    cell: () => (
      <RowActions>
        <DropdownMenuItem className="cursor-pointer">
          {t('admin.common.actions.edit')}
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">View detail</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" className="cursor-pointer">
          {t('admin.common.actions.cancel')}
        </DropdownMenuItem>
      </RowActions>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];

const PRODUCT_COLUMNS: ColumnDef<ProductRow, unknown>[] = [
  {
    id: 'select',
    header: ({ table }) => <SelectionCheckbox table={table} />,
    cell: ({ row }) => <RowCheckbox row={row} />,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <SortableHeader
        label="Name"
        sorted={column.getIsSorted()}
        onToggle={column.getToggleSortingHandler()}
      />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.name}</span>
        <span className="text-muted-foreground font-mono text-xs">{row.original.sku}</span>
      </div>
    ),
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge>,
  },
  {
    accessorKey: 'basePrice',
    header: () => <div className="text-end">Base price</div>,
    cell: ({ row }) => (
      <div className="text-end tabular-nums">{formatMMK(row.original.basePrice)}</div>
    ),
  },
  {
    accessorKey: 'salePrice',
    header: () => <div className="text-end">Sale price</div>,
    cell: ({ row }) => (
      <div className="text-end tabular-nums">
        {row.original.salePrice ? formatMMK(row.original.salePrice) : '—'}
      </div>
    ),
  },
  {
    accessorKey: 'totalStock',
    header: () => <div className="text-end">Stock</div>,
    cell: ({ row }) => (
      <div className="text-end tabular-nums">
        {row.original.totalStock === 0 ? (
          <Badge variant="destructive" className="cursor-default">
            Out
          </Badge>
        ) : row.original.totalStock < 10 ? (
          <Badge variant="outline" className="cursor-default">
            {row.original.totalStock}
          </Badge>
        ) : (
          row.original.totalStock
        )}
      </div>
    ),
  },
  {
    accessorKey: 'isPublished',
    header: 'Active',
    cell: ({ row }) => (
      <Badge
        variant={row.original.isPublished ? 'default' : 'secondary'}
        className="cursor-default"
      >
        {row.original.isPublished ? 'Yes' : 'No'}
      </Badge>
    ),
  },
  {
    accessorKey: 'isFeatured',
    header: 'Featured',
    cell: ({ row }) => (
      <Badge variant={row.original.isFeatured ? 'default' : 'outline'} className="cursor-default">
        {row.original.isFeatured ? 'Yes' : 'No'}
      </Badge>
    ),
  },
  {
    id: 'actions',
    cell: () => (
      <RowActions>
        <DropdownMenuItem className="cursor-pointer">
          {t('admin.common.actions.edit')}
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">Duplicate</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" className="cursor-pointer">
          {t('admin.common.actions.delete')}
        </DropdownMenuItem>
      </RowActions>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];

const INVENTORY_COLUMNS: ColumnDef<InventoryRow, unknown>[] = [
  {
    id: 'select',
    header: ({ table }) => <SelectionCheckbox table={table} />,
    cell: ({ row }) => <RowCheckbox row={row} />,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'productName',
    header: ({ column }) => (
      <SortableHeader
        label="Product"
        sorted={column.getIsSorted()}
        onToggle={column.getToggleSortingHandler()}
      />
    ),
    cell: ({ row }) => <span className="font-medium">{row.original.productName}</span>,
  },
  {
    id: 'variant',
    header: 'Variant',
    accessorFn: (row) => row.colorName,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="border-border inline-block size-3 rounded-full border"
          style={{ backgroundColor: row.original.colorHex }}
        />
        <span>{row.original.colorName}</span>
      </div>
    ),
  },
  {
    accessorKey: 'size',
    header: 'Size',
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.size}</span>,
  },
  {
    accessorKey: 'stock',
    header: () => <div className="text-end">Stock</div>,
    cell: ({ row }) => (
      <div className="text-end tabular-nums">
        {row.original.stock === 0 ? (
          <Badge variant="destructive" className="cursor-default">
            Out
          </Badge>
        ) : row.original.stock < 5 ? (
          <Badge variant="outline" className="cursor-default">
            {row.original.stock}
          </Badge>
        ) : (
          row.original.stock
        )}
      </div>
    ),
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => (
      <SortableHeader
        label="Updated"
        sorted={column.getIsSorted()}
        onToggle={column.getToggleSortingHandler()}
      />
    ),
    cell: ({ row }) => <span className="tabular-nums">{formatDate(row.original.updatedAt)}</span>,
  },
  {
    id: 'actions',
    cell: () => (
      <RowActions>
        <DropdownMenuItem className="cursor-pointer">Edit stock</DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">View product</DropdownMenuItem>
      </RowActions>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];

function getOrderSearchText(row: OrderRow): string {
  return [row.orderNumber, row.customer, row.email].join(' ');
}

function getProductSearchText(row: ProductRow): string {
  return [row.name, row.sku, row.category].join(' ');
}

function getInventorySearchText(row: InventoryRow): string {
  return [row.productName, row.colorName, row.size].join(' ');
}

function OrdersTablePreview({ isEmpty }: { isEmpty: boolean }) {
  const data = isEmpty ? [] : ORDER_ROWS;
  return (
    <DataTable<OrderRow>
      tableId="dev-orders"
      columns={ORDER_COLUMNS}
      data={data}
      defaultPageSize={5}
      globalSearchPlaceholder="Search orders…"
      getSearchableText={getOrderSearchText}
      getRowId={(row) => row._id}
      emptyTitle="No orders"
      emptyDescription="There are no orders to display."
      emptyAction={<Button className="cursor-pointer">Refresh</Button>}
      bulkActions={(selected) => (
        <>
          <Button size="sm" variant="outline" className="cursor-pointer">
            Mark as confirmed
          </Button>
          <Button size="sm" variant="destructive" className="cursor-pointer">
            Cancel
          </Button>
          <span className="text-muted-foreground text-xs">{selected.length} selected</span>
        </>
      )}
    />
  );
}

function ProductsTablePreview({ isEmpty }: { isEmpty: boolean }) {
  const data = isEmpty ? [] : PRODUCT_ROWS;
  return (
    <DataTable<ProductRow>
      tableId="dev-products"
      columns={PRODUCT_COLUMNS}
      data={data}
      defaultPageSize={5}
      globalSearchPlaceholder="Search products…"
      getSearchableText={getProductSearchText}
      getRowId={(row) => row._id}
      emptyTitle="No products"
      emptyDescription="No products match your filters."
      emptyAction={<Button className="cursor-pointer">Add product</Button>}
      bulkActions={(selected) => (
        <>
          <Button size="sm" variant="outline" className="cursor-pointer">
            Toggle featured
          </Button>
          <Button size="sm" variant="destructive" className="cursor-pointer">
            Archive
          </Button>
          <span className="text-muted-foreground text-xs">{selected.length} selected</span>
        </>
      )}
    />
  );
}

function InventoryTablePreview({ isEmpty }: { isEmpty: boolean }) {
  const data = isEmpty ? [] : INVENTORY_ROWS;
  return (
    <DataTable<InventoryRow>
      tableId="dev-inventory"
      columns={INVENTORY_COLUMNS}
      data={data}
      defaultPageSize={5}
      globalSearchPlaceholder="Search inventory…"
      getSearchableText={getInventorySearchText}
      getRowId={(row) => row._id}
      emptyTitle="No inventory"
      emptyDescription="No stock entries to display."
      emptyAction={<Button className="cursor-pointer">Add stock</Button>}
      bulkActions={(selected) => (
        <Button size="sm" variant="outline" className="cursor-pointer">
          Restock {selected.length}
        </Button>
      )}
    />
  );
}

type TabValue = 'orders' | 'products' | 'inventory';

function isTabValue(value: string): value is TabValue {
  return value === 'orders' || value === 'products' || value === 'inventory';
}

function DevDataTablePage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isEmpty, setIsEmpty] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<TabValue>('orders');

  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="DataTable dev preview"
        description="Internal preview of the generic DataTable component. Not visible in production."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={isLoading ? 'default' : 'outline'}
              onClick={() => {
                setIsLoading((prev) => !prev);
                setIsEmpty(false);
              }}
              className="cursor-pointer"
            >
              {isLoading ? 'Stop loading' : 'Toggle loading'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={isEmpty ? 'default' : 'outline'}
              onClick={() => {
                setIsEmpty((prev) => !prev);
                setIsLoading(false);
              }}
              className="cursor-pointer"
            >
              {isEmpty ? 'Restore rows' : 'Toggle empty'}
            </Button>
          </div>
        }
      />

      <div className="border-border bg-card flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 text-sm">
        <span className="text-muted-foreground">Tabs:</span>
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            if (isTabValue(value)) {
              setActiveTab(value);
            }
          }}
        >
          <TabsList>
            <TabsTrigger value="orders">
              <ShoppingBagIcon className="me-1.5 size-3.5" aria-hidden />
              Orders
            </TabsTrigger>
            <TabsTrigger value="products">
              <PackageIcon className="me-1.5 size-3.5" aria-hidden />
              Products
            </TabsTrigger>
            <TabsTrigger value="inventory">
              <CircleCheckIcon className="me-1.5 size-3.5" aria-hidden />
              Inventory
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <span className="text-muted-foreground ms-auto text-xs">Active: {activeTab}</span>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (isTabValue(value)) {
            setActiveTab(value);
          }
        }}
      >
        <TabsContent value="orders">
          <SectionHeading title="Orders" hint="OrderRow dataset (8 mock rows)" />
          {isLoading ? (
            <DataTableSkeleton columnCount={7} rowCount={5} />
          ) : (
            <OrdersTablePreview isEmpty={isEmpty} />
          )}
        </TabsContent>
        <TabsContent value="products">
          <SectionHeading title="Products" hint="ProductRow dataset (7 mock rows)" />
          {isLoading ? (
            <DataTableSkeleton columnCount={9} rowCount={5} />
          ) : (
            <ProductsTablePreview isEmpty={isEmpty} />
          )}
        </TabsContent>
        <TabsContent value="inventory">
          <SectionHeading title="Inventory" hint="InventoryRow dataset (8 mock rows)" />
          {isLoading ? (
            <DataTableSkeleton columnCount={7} rowCount={5} />
          ) : (
            <InventoryTablePreview isEmpty={isEmpty} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SectionHeading({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-base font-semibold">{title}</h2>
      <span className="text-muted-foreground text-xs">{hint}</span>
    </div>
  );
}

export default DevDataTablePage;
