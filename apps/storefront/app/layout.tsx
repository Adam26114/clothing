import { Geist, Geist_Mono } from 'next/font/google';

import '@workspace/ui/globals.css';
import { ConvexProvider } from '@workspace/lib/providers/convex';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@workspace/ui/components/sonner';
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
            defaultTheme="light"
            enableSystem={false}
            forcedTheme="light"
            disableTransitionOnChange
            disableHotkey
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </ConvexProvider>
      </body>
    </html>
  );
}
