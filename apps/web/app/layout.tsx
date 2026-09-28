import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { AuthProvider } from '@/context/AuthContext';
import { defaultBranding, WhitelabelBranding } from '@/context/WhitelabelContext';
import { WhitelabelProvider } from '@/context/WhitelabelProvider';
import AppThemeProvider from '@/components/ui/AppThemeProvider';
import { Toaster } from 'react-hot-toast';

import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const brandingHeader = headersList.get('x-branding');
  let companyName = 'V SMS';
  let icons: any = { icon: '/v-sms-favicon.ico' };

  if (brandingHeader) {
    try {
      const parsed = JSON.parse(brandingHeader);
      companyName = parsed.companyName || 'V SMS';
      if (parsed.isWhitelabel) {
        if (parsed.logoUrl) {
          icons = { icon: parsed.logoUrl };
        } else if (parsed.companyName) {
          const letter = (parsed.companyName.trim()[0] || 'S').toUpperCase();
          const color = parsed.primaryColor || '#7c3aed';
          const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='${encodeURIComponent(color)}'/><text x='50%' y='55%' font-family='system-ui, sans-serif' font-weight='800' font-size='18' fill='%23ffffff' text-anchor='middle' dominant-baseline='middle'>${letter}</text></svg>`;
          icons = { icon: `data:image/svg+xml,${encodeURIComponent(svg)}` };
        }
      }
    } catch {}
  }
  
  return {
    title: {
      template: `%s | ${companyName}`,
      default: companyName,
    },
    description: 'Enterprise-grade SMS Gateway platform.',
    ...(icons ? { icons } : {}),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read branding injected by middleware — this is server-side only
  const headersList = await headers();
  const brandingHeader = headersList.get('x-branding');

  let branding: WhitelabelBranding = defaultBranding;
  if (brandingHeader) {
    try {
      const parsed = JSON.parse(brandingHeader);
      branding = { ...defaultBranding, ...parsed };
    } catch {
      // fallback to default if header is malformed
    }
  }

  return (
    <html lang="en" className={inter.className}>
      <head>
        {/* Inject brand primary color as CSS variable for global use */}
        <style>{`:root { --brand-primary: ${branding.primaryColor}; }`}</style>
      </head>
      <body>
        <AppRouterCacheProvider>
          {/* Pass branding from server into the React context tree */}
          <WhitelabelProvider branding={branding}>
            <Toaster position="top-right" />
            <AppThemeProvider primaryColor={branding.primaryColor}>
              <AuthProvider>
                {children}
              </AuthProvider>
            </AppThemeProvider>
          </WhitelabelProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}