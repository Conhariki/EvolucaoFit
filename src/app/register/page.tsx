'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Select,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import axios from 'axios';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'PROFESSOR' | 'ALUNO'>('ALUNO');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await axios.post('/api/auth/register', {
        name,
        email,
        password,
        role,
      });

      toast({
        title: 'Conta criada com sucesso!',
        description: 'Você já pode fazer login.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      router.push('/login');
    } catch (error: any) {
      toast({
        title: 'Erro ao criar conta',
        description: error.response?.data?.message || 'Ocorreu um erro ao criar sua conta.',
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
        <Heading>Criar Conta</Heading>
        <Text>Preencha os dados para criar sua conta</Text>

        <Box w="100%" p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nome</FormLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </FormControl>

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

              <FormControl isRequired>
                <FormLabel>Tipo de Conta</FormLabel>
                <Select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'PROFESSOR' | 'ALUNO')}
                >
                  <option value="ALUNO">Aluno</option>
                  <option value="PROFESSOR">Professor</option>
                </Select>
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                width="100%"
                isLoading={isLoading}
              >
                Criar Conta
              </Button>
            </VStack>
          </form>
        </Box>

        <Text>
          Já tem uma conta?{' '}
          <Link as={NextLink} href="/login" color="blue.500">
            Faça login
          </Link>
        </Text>
      </VStack>
    </Container>
  );
} 