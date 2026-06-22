import { notFound } from 'next/navigation';

import { OrderDetailClient } from './order-detail-client';

const CONVEX_ID_PATTERN = /^[a-z0-9]{20,40}$/i;

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  if (!id || !CONVEX_ID_PATTERN.test(id)) {
    notFound();
  }
  return <OrderDetailClient orderId={id} />;
}
