'use client';

import { useState } from 'react';
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
} from '@chakra-ui/react';
import NextLink from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await axios.post('/api/auth/forgot-password', { email });

            toast({
                title: 'Código enviado',
                description: 'Se o email estiver cadastrado, você receberá um código de recuperação.',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });

            // Store email temporarily to pre-fill next step? 
            // Or just redirect and ask for email again? 
            // Let's redirect to reset page with query param
            router.push(`/reset-password?email=${encodeURIComponent(email)}`);

        } catch (error) {
            toast({
                title: 'Erro ao solicitar recuperação',
                description: 'Tente novamente mais tarde.',
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
                <Heading>Recuperar Senha</Heading>
                <Text>Digite seu email para receber um código de recuperação.</Text>

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

                            <Button
                                type="submit"
                                colorScheme="blue"
                                width="100%"
                                isLoading={isLoading}
                            >
                                Enviar Código
                            </Button>
                        </VStack>
                    </form>
                </Box>

                <Link as={NextLink} href="/login" color="blue.500">
                    Voltar para o Login
                </Link>
            </VStack>
        </Container>
    );
}
