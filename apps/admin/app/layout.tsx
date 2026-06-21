import { Geist, Geist_Mono } from 'next/font/google';

import './globals.css';
import { ConvexProvider } from '@workspace/lib/providers/convex';
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
      <body>
        <ConvexProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              <SidebarProvider>
                <AdminSidebar />
                <SidebarInset>
                  <AdminHeader />
                  <main className="flex-1 p-4 lg:p-6">{children}</main>
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
