import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeftIcon } from 'lucide-react';

import { t } from '@workspace/lib/i18n';
import { loadCategoryPageData } from '@/lib/convex-ssr';
import { CategoryHeader } from '@/components/storefront/category-header';
import { ProductGrid } from '@/components/storefront/product-grid';
import { StorefrontBreadcrumb } from '@/components/storefront/breadcrumb';
import { cn } from '@workspace/ui/lib/utils';

export const dynamic = 'force-dynamic';

interface SubcategoryPageProps {
  params: Promise<{ category: string; subcategory: string }>;
}

export default async function SubcategoryPage({ params }: SubcategoryPageProps) {
  const { category: categorySlug, subcategory: subcategorySlug } = await params;
  const { category, parentCategory } = await loadCategoryPageData(categorySlug, subcategorySlug);

  if (!category) {
    notFound();
  }

  const parentName = parentCategory?.name ?? categorySlug;

  return (
    <main className="bg-background text-foreground min-h-svh">
      <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12 lg:py-16">
        <StorefrontBreadcrumb
          items={[{ label: parentName, href: `/${categorySlug}` }, { label: category.name }]}
          className="mb-6"
        />
        <Link
          href={`/${categorySlug}`}
          className={cn(
            'text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors',
            'focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none',
            'cursor-pointer'
          )}
        >
          <ArrowLeftIcon aria-hidden className="size-4 rtl:rotate-180" />
          <span>{t('plp.backToCategory', 'en', { name: parentName })}</span>
        </Link>
        <div className="mt-3">
          <CategoryHeader name={category.name} description={category.description ?? null} />
        </div>
        <ProductGrid categorySlug={categorySlug} subcategorySlug={subcategorySlug} />
      </div>
    </main>
  );
}
