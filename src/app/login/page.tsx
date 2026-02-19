'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Container,
  Link,
  Flex,
  useColorModeValue,
  useColorMode,
  IconButton,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { FcGoogle } from 'react-icons/fc';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';

export default function LoginPage() {
  const { colorMode, toggleColorMode } = useColorMode();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: 'Erro ao fazer login',
          description: result.error,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      toast({
        title: 'Erro ao fazer login',
        description: 'Ocorreu um erro ao tentar fazer login. Tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error('Erro ao conectar com Google:', error);
      toast({
        title: 'Erro de conexão',
        description: 'Não foi possível iniciar o login com Google.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.sm" py={10} minH="100vh" display="flex" alignItems="center" justifyContent="center" position="relative">
      <Box position="absolute" top={4} right={4}>
        <IconButton
          aria-label="Alternar tema"
          icon={colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
          onClick={toggleColorMode}
          variant="ghost"
          size="lg"
        />
      </Box>
      <VStack spacing={8} w="full">
        <Heading color={useColorModeValue('gray.800', 'white')}>Bem-vindo ao EvoluçãoFit</Heading>
        <Text color={useColorModeValue('gray.600', 'gray.300')}>Faça login para acessar sua conta</Text>

        <Box w="100%" p={8} borderWidth={1} borderRadius="lg" boxShadow="lg" bg={useColorModeValue('white', 'gray.700')}>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Senha</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                width="100%"
                isLoading={isLoading}
              >
                Entrar
              </Button>
            </VStack>
          </form>


          <Box mt={6}>
            <Box position="relative" padding="4">
              <Box position="absolute" top="50%" left="0" right="0" borderTop="1px" borderColor="gray.200" />
              <Box position="relative" bg={useColorModeValue('white', 'gray.700')} px="4" textAlign="center" color="gray.500" fontSize="sm">
                OU
              </Box>
            </Box>

            <Button
              w={'full'}
              variant={'outline'}
              leftIcon={<FcGoogle />}
              onClick={handleGoogleLogin}
            >
              Entrar com Google
            </Button>
          </Box>
        </Box >
      </VStack >
    </Container >
  );
} 