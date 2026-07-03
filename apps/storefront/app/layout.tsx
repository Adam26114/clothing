import { Geist, Geist_Mono } from 'next/font/google';

import '@workspace/ui/globals.css';
import { ConvexProvider } from '@workspace/lib/providers/convex';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@workspace/ui/components/sonner';
import { cn } from '@workspace/ui/lib/utils';

import { StorefrontHeader } from '@/components/storefront/header';
import { StorefrontFooter } from '@/components/storefront/footer';
import { CartDrawer } from '@/components/storefront/cart-drawer';
import { AuthMerge } from '@/components/storefront/auth-merge';

export const dynamic = 'force-dynamic';

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

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
            <AuthMerge />
            <div className="flex min-h-svh flex-col">
              <StorefrontHeader />
              <main className="flex-1">{children}</main>
              <StorefrontFooter />
            </div>
            <CartDrawer />
            <Toaster />
          </ThemeProvider>
        </ConvexProvider>
      </body>
    </html>
  );
}
