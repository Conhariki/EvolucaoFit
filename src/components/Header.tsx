import { Box, Flex, Button, useColorModeValue, IconButton } from '@chakra-ui/react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      as="header"
      position="fixed"
      w="100%"
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      zIndex="sticky"
      px={4}
      py={2}
    >
      <Flex justify="space-between" align="center" maxW="1200px" mx="auto">
        <Box
          fontSize="xl"
          fontWeight="bold"
          cursor="pointer"
          onClick={() => router.push('/dashboard')}
        >
          EvoluçãoFit
        </Box>

        <Flex gap={4} align="center">
          <IconButton
            aria-label="Alternar tema"
            icon={isDarkMode ? <SunIcon /> : <MoonIcon />}
            onClick={toggleTheme}
            variant="ghost"
          />
          
          {session ? (
            <Button
              onClick={() => signOut()}
              variant="ghost"
              colorScheme="red"
            >
              Sair
            </Button>
          ) : (
            <Button
              onClick={() => router.push('/login')}
              colorScheme="blue"
            >
              Entrar
            </Button>
          )}
        </Flex>
      </Flex>
    </Box>
  );
} 