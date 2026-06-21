import { OrderDetailCard } from '@/components/storefront/account/order-detail-card';

export const dynamic = 'force-dynamic';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-6">
      <OrderDetailCard orderId={id} />
    </div>
  );
}
