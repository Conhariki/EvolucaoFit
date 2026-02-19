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
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { FcGoogle } from 'react-icons/fc';

export default function LoginPage() {
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

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={8}>
        <Heading>Bem-vindo ao EvoluçãoFit</Heading>
        <Text>Faça login para acessar sua conta</Text>

        <Box w="100%" p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
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
              <Box position="relative" bg="white" px="4" textAlign="center" color="gray.500" fontSize="sm">
                OU
              </Box>
            </Box>

            <Button
              w={'full'}
              variant={'outline'}
              leftIcon={<FcGoogle />}
              onClick={() => signIn('google')}
            >
              Entrar com Google
            </Button>
          </Box>
        </Box >

        <Text>
          Não tem uma conta?{' '}
          <Link as={NextLink} href="/register" color="blue.500">
            Registre-se
          </Link>
        </Text>
      </VStack >
    </Container >
  );
} 