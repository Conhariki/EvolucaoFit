'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { ChakraProvider, useColorMode } from '@chakra-ui/react';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: true,
  toggleTheme: () => { },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorMode, setColorMode } = useColorMode();
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Chakra UI manages localStorage automatically with the key 'chakra-ui-color-mode'
    // We just need to sync our state with Chakra's system
    setIsDarkMode(colorMode === 'dark');
  }, [colorMode]);

  const toggleTheme = () => {
    // toggleColorMode handles the switch and localStorage update
    const newTheme = colorMode === 'dark' ? 'light' : 'dark';
    setColorMode(newTheme);
    setIsDarkMode(newTheme === 'dark');
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext); 