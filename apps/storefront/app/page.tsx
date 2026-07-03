import { loadHomepageData } from '@/lib/convex-ssr';
import { CategoryPills } from '@/components/storefront/category-pills';
import { FeaturedProducts } from '@/components/storefront/featured-products';
import { HomepageHero } from '@/components/storefront/homepage-hero';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { settings, categories, featured } = await loadHomepageData();

  return (
    <main className="bg-background text-foreground min-h-svh">
      <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12 lg:py-16">
        <div className="flex flex-col gap-16 md:gap-20 lg:gap-24">
          <HomepageHero
            heroImageId={settings?.heroImageId}
            heroImageColorHex={null}
            eyebrow={null}
            title={settings?.heroTitle ?? null}
            subtitle={settings?.heroSubtitle ?? null}
            ctaLabel={settings?.heroCtaLabel ?? null}
            ctaLink={settings?.heroCtaLink ?? null}
          />
          <CategoryPills items={categories ?? []} />
          <FeaturedProducts items={featured?.items ?? []} />
        </div>
      </div>
    </main>
  );
}
