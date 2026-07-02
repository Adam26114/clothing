'use client';

import * as React from 'react';
import { ConvexError } from 'convex/values';
import { useRouter } from 'next/navigation';

const STOREFRONT_LOGIN_URL = '/auth/login';

function getStorefrontLoginUrl(): string {
  const base = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? 'http://localhost:3000';
  try {
    return new URL(STOREFRONT_LOGIN_URL, base).toString();
  } catch {
    return `${base}${STOREFRONT_LOGIN_URL}`;
  }
}

function isAuthError(error: unknown): boolean {
  if (error instanceof ConvexError) {
    const data = error.data;
    if (typeof data === 'string' && data.toLowerCase().includes('not authenticated')) {
      return true;
    }
    if (
      data &&
      typeof data === 'object' &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string' &&
      (data as { message: string }).message.toLowerCase().includes('not authenticated')
    ) {
      return true;
    }
  }
  if (error instanceof Error && error.message.toLowerCase().includes('not authenticated')) {
    return true;
  }
  return false;
}

interface AdminAuthBoundaryProps {
  children: React.ReactNode;
}

interface AdminAuthBoundaryState {
  hasError: boolean;
}

export class AdminAuthBoundary extends React.Component<
  AdminAuthBoundaryProps,
  AdminAuthBoundaryState
> {
  state: AdminAuthBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: unknown): AdminAuthBoundaryState | null {
    if (isAuthError(error)) {
      return { hasError: true };
    }
    return null;
  }

  componentDidCatch(error: Error): void {
    if (!isAuthError(error)) {
      console.error('[AdminAuthBoundary] Unhandled error:', error);
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return <AdminAuthRedirect />;
    }
    return this.props.children;
  }
}

function AdminAuthRedirect(): React.JSX.Element {
  const router = useRouter();

  React.useEffect(() => {
    const target = getStorefrontLoginUrl();
    if (typeof window !== 'undefined') {
      try {
        document.cookie = '__convexAuth=; Path=/; Max-Age=0; SameSite=Lax';
      } catch {
        // ignore cookie clear failures (e.g. private mode)
      }
      window.location.replace(target);
      return;
    }
    router.replace(target);
  }, [router]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="text-muted-foreground flex min-h-[50vh] items-center justify-center text-sm"
    >
      Session expired. Redirecting to sign in…
    </div>
  );
}
