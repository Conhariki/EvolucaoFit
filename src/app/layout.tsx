import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { ColorModeScript } from '@chakra-ui/react';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Evolução Fit',
  description: 'Acompanhe sua evolução física',
  manifest: '/manifest.json',
  themeColor: '#4A90E2',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ColorModeScript initialColorMode="dark" />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
} 