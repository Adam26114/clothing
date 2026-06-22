import { notFound } from 'next/navigation';

import { UserDetailClient } from './user-detail-client';

const CONVEX_ID_PATTERN = /^[a-z0-9]{20,40}$/i;

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;
  if (!id || !CONVEX_ID_PATTERN.test(id)) {
    notFound();
  }
  return <UserDetailClient userId={id} />;
}
