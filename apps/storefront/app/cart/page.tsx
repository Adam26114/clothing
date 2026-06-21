import { CartPageContent } from '@/components/storefront/cart/cart-page-content';

export const dynamic = 'force-dynamic';

export default function CartPage() {
  return (
    <main className="bg-background text-foreground min-h-svh">
      <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
        <CartPageContent />
      </div>
    </main>
  );
}
