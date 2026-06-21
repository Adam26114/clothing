import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { loadProductData } from '@/lib/convex-ssr';
import { PdpShell } from '@/components/storefront/pdp-shell';
import { RelatedProducts } from '@/components/storefront/related-products';
import { StorefrontBreadcrumb } from '@/components/storefront/breadcrumb';
import { t } from '@workspace/lib/i18n';

export const dynamic = 'force-dynamic';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await loadProductData(slug);
  if (!product) {
    return { title: t('errors.productSoldOut') };
  }
  return {
    title: `${product.name} — ${t('brandName')}`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const { product } = await loadProductData(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="bg-background text-foreground min-h-svh">
      <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12 lg:py-16">
        <StorefrontBreadcrumb items={[{ label: product.name }]} className="mb-6" />
        <PdpShell product={product} />
        <RelatedProducts />
      </div>
    </main>
  );
}
