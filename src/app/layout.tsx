import type { Metadata } from 'next';
import { AuthProvider } from '@/components/auth-provider';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';
import { AppProvider } from '@/components/app-provider';
import { PT_Sans, Space_Grotesk } from 'next/font/google';
import { InstallPWA } from '@/components/install-pwa';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: 'CampusConnect',
  description: 'A modern, feature-rich E-Learning platform.',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ptSans.variable} ${spaceGrotesk.variable} font-body antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppProvider>
            <FirebaseClientProvider>
              <AuthProvider>
                {children}
                <Toaster />
                <InstallPWA />
              </AuthProvider>
            </FirebaseClientProvider>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
