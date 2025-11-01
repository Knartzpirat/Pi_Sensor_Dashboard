import './globals.css';

import { NextIntlClientProvider } from 'next-intl';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

type Props = {
  children: React.ReactNode;
};

export default async function RootLayout({ children }: Props) {
  return (
    <html suppressHydrationWarning={true} data-lt-installed="true">
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NuqsAdapter>
            <NextIntlClientProvider>
              {/* TODO: Add Global Layout Enhancements
               * - Create components/layout/loading-provider.tsx for global loading states
               * - Create components/layout/error-boundary.tsx for error handling
               * - Create components/layout/websocket-provider.tsx for real-time updates
               * - Create components/layout/analytics-provider.tsx for user analytics
               * - Create components/layout/keyboard-shortcuts.tsx for global hotkeys
               * - Add service worker for offline support and push notifications
               * - Add global progress indicator for page transitions
               * - Add keyboard shortcuts helper modal (Ctrl+?)
               */}
              <main>{children}</main>
              <Toaster />
            </NextIntlClientProvider>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
