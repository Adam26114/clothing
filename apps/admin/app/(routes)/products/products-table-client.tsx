'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { PlusIcon } from 'lucide-react';
import type { Id } from '@workspace/convex/_generated/dataModel';
import { api } from '@workspace/convex/_generated/api';

import { Button } from '@workspace/ui/components/button';
import { DataTable, type ColumnDef } from '@workspace/ui/components/data-table';
import { AdminPageHeader } from '@workspace/ui/components/admin/page-header';
import { t } from '@workspace/lib/i18n';

import {
  makeProductColumns,
  toProductRow,
  getProductSearchableText,
  type ProductRow,
} from '@/components/admin/products/columns';
import {
  ProductsTableToolbar,
  type ActiveFilter,
  type FeaturedFilter,
} from '@/components/admin/products/products-table-toolbar';
import { EmptyProducts } from '@/components/admin/products/empty-products';

const DEFAULT_PAGE_SIZE = 20;

export function ProductsTableClient() {
  const router = useRouter();
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState<Id<'categories'> | 'all'>('all');
  const [active, setActive] = React.useState<ActiveFilter>('all');
  const [featured, setFeatured] = React.useState<FeaturedFilter>('all');

  const debouncedSearch = useDebounced(search, 300);
  const trimmedSearch = debouncedSearch.trim();

  const queryArgs = React.useMemo(
    () => ({
      search: trimmedSearch.length > 0 ? trimmedSearch : undefined,
      isPublished: active === 'all' ? undefined : active === 'active',
      isFeatured: featured === 'all' ? undefined : featured === 'featured',
      pageSize: DEFAULT_PAGE_SIZE,
    }),
    [trimmedSearch, active, featured]
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

  const total = result?.total ?? 0;
  const shown = rows.length;

  const hasActiveFilter =
    search.length > 0 || category !== 'all' || active !== 'all' || featured !== 'all';

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t('admin.products.title')}
        actions={
          <Button render={<Link href="/products/new" />} size="sm" className="cursor-pointer">
            <PlusIcon className="me-1.5 size-4" aria-hidden />
            {t('admin.products.addProduct')}
          </Button>
        }
      />
      <ProductsTableToolbar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        active={active}
        onActiveChange={setActive}
        featured={featured}
        onFeaturedChange={setFeatured}
        categories={categoriesResult ?? []}
        onClear={() => {
          setSearch('');
          setCategory('all');
          setActive('all');
          setFeatured('all');
        }}
        shown={shown}
        total={total}
      />
      {result === undefined || categoriesResult === undefined ? (
        <DataTable<ProductRow>
          tableId="admin-products"
          columns={columns}
          data={[]}
          isLoading
          defaultPageSize={DEFAULT_PAGE_SIZE}
          globalSearchPlaceholder={t('admin.products.searchPlaceholder')}
          getSearchableText={getProductSearchableText}
          getRowId={(row) => row._id}
        />
      ) : rows.length === 0 ? (
        <EmptyProducts hasFilters={hasActiveFilter} onAdd={() => router.push('/products/new')} />
      ) : (
        <DataTable<ProductRow>
          tableId="admin-products"
          columns={columns}
          data={rows}
          defaultPageSize={DEFAULT_PAGE_SIZE}
          globalSearchPlaceholder={t('admin.products.searchPlaceholder')}
          getSearchableText={getProductSearchableText}
          getRowId={(row) => row._id}
          emptyTitle={t('admin.products.noResults')}
          emptyDescription={t('admin.products.noResultsDescription')}
        />
      )}
    </div>
  );
}

function useDebounced(value: string, delayMs: number): string {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}
