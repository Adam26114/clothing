import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import './globals.css';
import { ConvexProvider } from '@workspace/lib/providers/convex';
import { getToken } from '@/lib/auth-server';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@workspace/ui/components/sonner';
import { SidebarInset, SidebarProvider } from '@workspace/ui/components/sidebar';
import { AdminHeader } from '@/components/admin-header';
import { AdminSidebar } from '@/components/admin-sidebar';
import { TooltipProvider } from '@workspace/ui/components/tooltip';
import { cn } from '@workspace/lib/cn';

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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'Khit Admin',
    template: '%s | Khit Admin',
  },
  description: 'Internal admin panel for the Khit storefront.',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = await getToken();
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={cn('antialiased', fontSans.variable, fontMono.variable)}
    >
      <body>
        <ConvexProvider initialToken={token}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              <SidebarProvider
                style={
                  {
                    '--sidebar-width': '18rem',
                    '--header-height': 'calc(var(--spacing) * 12)',
                    '--sidebar-width-icon': '3rem',
                  } as React.CSSProperties
                }
              >
                <AdminSidebar />
                <SidebarInset>
                  <AdminHeader />
                  <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
                </SidebarInset>
              </SidebarProvider>
              <Toaster />
            </TooltipProvider>
          </ThemeProvider>
        </ConvexProvider>
      </body>
    </html>
  );
}
