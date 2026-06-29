'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { PlusIcon } from 'lucide-react';
import type { Id } from '@workspace/convex/_generated/dataModel';
import { api } from '@workspace/convex/_generated/api';
import { useStoredRowOrder } from '@workspace/lib/hooks/use-stored-row-order';

import { Button } from '@workspace/ui/components/button';
import { DataTable, type ColumnDef } from '@workspace/ui/components/data-table';
import { t } from '@workspace/lib/i18n';

import {
  makeProductColumns,
  toProductRow,
  getProductSearchableText,
  type ProductRow,
} from '@/components/admin/products/columns';
import {
  ProductsFilters,
  type ActiveFilter,
  type FeaturedFilter,
} from '@/components/admin/products/products-filters';
import { EmptyProducts } from '@/components/admin/products/empty-products';

const DEFAULT_PAGE_SIZE = 20;
const TABLE_ID = 'admin-products';

export function ProductsTableClient() {
  const router = useRouter();
  const [category, setCategory] = React.useState<Id<'categories'> | 'all'>('all');
  const [active, setActive] = React.useState<ActiveFilter>('all');
  const [featured, setFeatured] = React.useState<FeaturedFilter>('all');

  const queryArgs = React.useMemo(
    () => ({
      isPublished: active === 'all' ? undefined : active === 'active',
      isFeatured: featured === 'all' ? undefined : featured === 'featured',
      pageSize: DEFAULT_PAGE_SIZE,
    }),
    [active, featured]
  );

  const result = useQuery(api.products.adminList, queryArgs);
  const categoriesResult = useQuery(api.categories.listActive, {});

  const columns = React.useMemo<ColumnDef<ProductRow, unknown>[]>(
    () => makeProductColumns(categoriesResult ?? []),
    [categoriesResult]
  );

  const rows = React.useMemo<ProductRow[]>(
    () => (result?.items ?? []).map((item) => toProductRow(item)),
    [result]
  );

  const { ordered, reorder } = useStoredRowOrder<ProductRow>(TABLE_ID, rows, (row) => row._id);

  const total = result?.total ?? 0;
  const hasActiveFilter = category !== 'all' || active !== 'all' || featured !== 'all';

  return (
    <DataTable<ProductRow>
      tableId={TABLE_ID}
      columns={columns}
      data={ordered}
      isLoading={result === undefined || categoriesResult === undefined}
      defaultPageSize={DEFAULT_PAGE_SIZE}
      globalSearchPlaceholder={t('admin.products.searchPlaceholder')}
      getSearchableText={getProductSearchableText}
      getRowId={(row) => row._id}
      toolbarTitle={t('admin.products.title')}
      toolbarActions={
        <Button render={<Link href="/products/new" />} size="sm" className="cursor-pointer">
          <PlusIcon className="me-1.5 size-4" aria-hidden />
          {t('admin.products.addProduct')}
        </Button>
      }
      toolbarFilters={
        <ProductsFilters
          category={category}
          onCategoryChange={setCategory}
          active={active}
          onActiveChange={setActive}
          featured={featured}
          onFeaturedChange={setFeatured}
          categories={categoriesResult ?? []}
        />
      }
      toolbarSummary={
        <span className="text-muted-foreground text-xs tabular-nums">
          {t('admin.products.showingOf', 'en', { shown: ordered.length, total })}
        </span>
      }
      emptyState={
        <EmptyProducts hasFilters={hasActiveFilter} onAdd={() => router.push('/products/new')} />
      }
      enableRowReorder
      onReorder={reorder}
    />
  );
}
