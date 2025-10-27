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
              <main>{children}</main>
              <Toaster />
            </NextIntlClientProvider>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
