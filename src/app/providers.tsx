'use client';

import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider } from '@chakra-ui/react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SessionProvider } from 'next-auth/react';
import { StudentProvider } from '@/contexts/StudentContext';
import { theme } from '@/lib/theme';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CacheProvider>
        <ChakraProvider theme={theme}>
          <ThemeProvider>
            <StudentProvider>{children}</StudentProvider>
          </ThemeProvider>
        </ChakraProvider>
      </CacheProvider>
    </SessionProvider>
  );
} 