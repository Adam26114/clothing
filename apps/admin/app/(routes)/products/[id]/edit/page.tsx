import { notFound } from 'next/navigation';

import { ProductFormClient } from '../../product-form-client';

const CONVEX_ID_PATTERN = /^[a-z0-9]{20,40}$/i;

interface ProductEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductEditPage({ params }: ProductEditPageProps) {
  const { id } = await params;
  if (!id || !CONVEX_ID_PATTERN.test(id)) {
    notFound();
  }
  return <ProductFormClient mode="edit" productId={id} />;
}
