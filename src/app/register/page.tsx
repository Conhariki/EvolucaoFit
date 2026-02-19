'use client';

import {
  Box,
  Heading,
  Text,
  Container,
  VStack,
  Button
} from '@chakra-ui/react';
import NextLink from 'next/link';

export default function RegisterPage() {
  return (
    <Container maxW="container.sm" py={20}>
      <VStack spacing={8} textAlign="center">
        <Heading>Registro Desativado</Heading>
        <Text fontSize="lg">
          O registro público de novas contas está desativado.
          Entre em contato com o administrador do sistema para solicitar acesso.
        </Text>

        <Box pt={4}>
          <Button as={NextLink} href="/login" colorScheme="blue">
            Voltar para o Login
          </Button>
        </Box>
      </VStack>
    </Container>
  );
} 