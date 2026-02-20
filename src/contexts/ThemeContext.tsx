'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useColorMode } from '@chakra-ui/react';
import { useSession } from 'next-auth/react';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => { },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorMode, setColorMode } = useColorMode();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { data: session, update: updateSession } = useSession();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // If the user is logged in, their session theme takes precedence but only on mount/login
    if (!isInitialized && session?.user?.theme) {
      if (session.user.theme !== colorMode) {
        setColorMode(session.user.theme);
      }
      setIsDarkMode(session.user.theme === 'dark');
      setIsInitialized(true);
    } else {
      // Just sync local state with chakra's colorMode
      setIsDarkMode(colorMode === 'dark');
    }
  }, [colorMode, session?.user?.theme, setColorMode, isInitialized]);

  const toggleTheme = async () => {
    const newTheme = colorMode === 'dark' ? 'light' : 'dark';
    setColorMode(newTheme);
    setIsDarkMode(newTheme === 'dark');

    if (session?.user) {
      try {
        await fetch('/api/user/theme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: newTheme }),
        });

        // Atualiza a sessão para refletir o novo tema
        await updateSession({ theme: newTheme });
      } catch (error) {
        console.error('Failed to save theme:', error);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext); 