import { loadHomepageData } from '@/lib/convex-ssr';
import { CategoryPills } from '@/components/storefront/category-pills';
import { FeaturedProducts } from '@/components/storefront/featured-products';
import { HeroBanner } from '@/components/storefront/hero-banner';
import { NewsletterSignup } from '@/components/storefront/newsletter-signup';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { settings, categories, featured } = await loadHomepageData();

  return (
    <main className="bg-background text-foreground min-h-svh">
      <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12 lg:py-16">
        <div className="flex flex-col gap-16 md:gap-20 lg:gap-24">
          <HeroBanner
            heroImageColorHex={null}
            eyebrow={null}
            title={settings?.heroTitle ?? null}
            subtitle={settings?.heroSubtitle ?? null}
            ctaLabel={settings?.heroCtaLabel ?? null}
            ctaLink={settings?.heroCtaLink ?? null}
          />
          <CategoryPills items={categories ?? []} />
          <FeaturedProducts items={featured?.items ?? []} />
          <NewsletterSignup />
        </div>
      </div>
    </main>
  );
}
