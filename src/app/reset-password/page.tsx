'use client';

import { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

export default function ResetPasswordPage() {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToast();

    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast({
                title: 'Senhas não conferem',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setIsLoading(true);

        try {
            await axios.post('/api/auth/reset-password', {
                email,
                code,
                newPassword,
            });

            toast({
                title: 'Senha alterada com sucesso!',
                description: 'Você já pode fazer login com a nova senha.',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });

            router.push('/login');
        } catch (error: any) {
            toast({
                title: 'Erro ao alterar senha',
                description: error.response?.data?.message || 'Ocorreu um erro ao alterar a senha.',
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
                <Heading>Definir Nova Senha</Heading>
                <Text>Digite o código recebido e sua nova senha.</Text>

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
                                <FormLabel>Código de Recuperação</FormLabel>
                                <Input
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="Ex: 123456"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Nova Senha</FormLabel>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="******"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Confirmar Nova Senha</FormLabel>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="******"
                                />
                            </FormControl>

                            <Button
                                type="submit"
                                colorScheme="blue"
                                width="100%"
                                isLoading={isLoading}
                            >
                                Alterar Senha
                            </Button>
                        </VStack>
                    </form>
                </Box>
            </VStack>
        </Container>
    );
}
