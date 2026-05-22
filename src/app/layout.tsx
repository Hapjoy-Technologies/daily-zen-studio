import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeRegistry } from '@/components/ThemeRegistry';
import { QueryProvider } from '@/components/QueryProvider';
import { AuthGate } from '@/components/AuthGate';
import { AppShell } from '@/components/AppShell';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Daily Zen Studio',
  description: 'Internal scheduling tool for the Gratitude Daily Zen content team.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ThemeRegistry>
          <QueryProvider>
            <AuthGate>
              <AppShell>{children}</AppShell>
            </AuthGate>
          </QueryProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
