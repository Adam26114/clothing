import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import '@workspace/ui/globals.css';
import { ConvexProvider } from '@workspace/lib/providers/convex';
import { CartUIProvider } from '@workspace/lib/hooks/use-cart-ui';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@workspace/ui/components/sonner';
import { cn } from '@workspace/lib/cn';

import { StorefrontHeader } from '@/components/storefront/header';
import { StorefrontFooter } from '@/components/storefront/footer';
import { CartDrawer } from '@/components/storefront/cart-drawer';
import { CartMergeOnAuth } from '@/components/storefront/cart-merge-on-auth';
import { WishlistMergeOnAuth } from '@/components/storefront/wishlist-merge-on-auth';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? 'http://localhost:3000';

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Khit — Minimal Shirts, Made in Myanmar',
    template: '%s | Khit',
  },
  description:
    'A Myanmar local brand shirt e-commerce platform. Shop minimal, editorial shirts with free in-store pickup and cash on delivery.',
  applicationName: 'Khit',
  keywords: ['Myanmar', 'shirts', 'local brand', 'minimal', 'editorial', 'fashion', 'Yangon'],
  authors: [{ name: 'Khit' }],
  creator: 'Khit',
  publisher: 'Khit',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'Khit',
    title: 'Khit — Minimal Shirts, Made in Myanmar',
    description: 'A Myanmar local brand shirt e-commerce platform.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Khit — Minimal Shirts, Made in Myanmar',
    description: 'A Myanmar local brand shirt e-commerce platform.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  icons: {
    icon: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={cn('antialiased', fontSans.variable, fontMono.variable)}
    >
      <body className="bg-background text-foreground min-h-svh">
        <ConvexProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            forcedTheme="light"
            disableTransitionOnChange
            disableHotkey
          >
            <CartUIProvider>
              <CartMergeOnAuth />
              <WishlistMergeOnAuth />
              <div className="flex min-h-svh flex-col">
                <StorefrontHeader />
                <main className="flex-1">{children}</main>
                <StorefrontFooter />
              </div>
              <CartDrawer />
            </CartUIProvider>
            <Toaster />
          </ThemeProvider>
        </ConvexProvider>
      </body>
    </html>
  );
}
