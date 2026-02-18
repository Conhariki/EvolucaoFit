'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { ChakraProvider, useColorMode } from '@chakra-ui/react';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: true,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorMode, setColorMode } = useColorMode();
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Carregar preferência do tema do localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
      setColorMode(savedTheme);
    } else {
      // Se não houver preferência salva, usar dark como padrão
      setIsDarkMode(true);
      setColorMode('dark');
      localStorage.setItem('theme', 'dark');
    }
  }, [setColorMode]);

  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    setColorMode(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext); 