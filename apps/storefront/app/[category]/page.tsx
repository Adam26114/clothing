import { notFound } from 'next/navigation';

import { loadCategoryPageData } from '@/lib/convex-ssr';
import { CategoryHeader } from '@/components/storefront/category-header';
import { ProductGrid } from '@/components/storefront/product-grid';
import { StorefrontBreadcrumb } from '@/components/storefront/breadcrumb';

export const dynamic = 'force-dynamic';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const { category } = await loadCategoryPageData(categorySlug);

  if (!category) {
    notFound();
  }

  return (
    <main className="bg-background text-foreground min-h-svh">
      <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12 lg:py-16">
        <StorefrontBreadcrumb items={[{ label: category.name }]} className="mb-6" />
        <CategoryHeader name={category.name} description={category.description ?? null} />
        <ProductGrid categorySlug={categorySlug} />
      </div>
    </main>
  );
}
