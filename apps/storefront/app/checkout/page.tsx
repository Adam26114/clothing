import { CheckoutPageContent } from '@/components/storefront/checkout/checkout-page-content';
import { StorefrontBreadcrumb } from '@/components/storefront/breadcrumb';
import { t } from '@workspace/lib/i18n';

export const dynamic = 'force-dynamic';

export default function CheckoutPage() {
  return (
    <main className="bg-background text-foreground min-h-svh">
      <div className="container mx-auto max-w-7xl px-4 py-6 md:py-8">
        <StorefrontBreadcrumb
          items={[{ label: t('cart.title'), href: '/cart' }, { label: t('checkout.title') }]}
          className="mb-4"
        />
        <h1 className="mb-6 text-2xl font-semibold tracking-tight md:text-3xl">
          {t('checkout.title')}
        </h1>
        <CheckoutPageContent />
      </div>
    </main>
  );
}
