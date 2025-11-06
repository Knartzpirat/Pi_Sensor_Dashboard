import './globals.css';

import { NextIntlClientProvider } from 'next-intl';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { PreferencesProvider } from '@/components/preferences-provider';
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
              <PreferencesProvider>
                <main>{children}</main>
                <Toaster />
              </PreferencesProvider>
            </NextIntlClientProvider>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
