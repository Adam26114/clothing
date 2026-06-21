import { ConfirmationClient } from '@/components/storefront/order-confirmation/confirmation-client';

export const dynamic = 'force-dynamic';

interface OrderConfirmationPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  const { id } = await params;

  return (
    <main className="bg-background text-foreground min-h-svh">
      <div className="container mx-auto max-w-7xl px-4 py-6 md:py-8">
        <ConfirmationClient orderId={id} />
      </div>
    </main>
  );
}
