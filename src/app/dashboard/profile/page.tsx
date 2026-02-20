
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    Box,
    Heading,
    Text,
    VStack,
    FormControl,
    FormLabel,
    Input,
    Button,
    useToast,
    Divider,
    Container,
    InputGroup,
    InputRightElement,
    IconButton,
    Switch,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useTheme } from '@/contexts/ThemeContext';
import axios from 'axios';

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const { isDarkMode, toggleTheme } = useTheme();
    const toast = useToast();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [height, setHeight] = useState('');
    const [role, setRole] = useState('');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchProfile();
        }
    }, [status]);

    const fetchProfile = async () => {
        try {
            const response = await axios.get('/api/profile');
            const data = response.data;
            setName(data.name);
            setEmail(data.email);
            setHeight(data.height || '');
            setRole(data.role);
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar os dados do perfil.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleUpdateProfile = async () => {
        setIsLoading(true);
        try {
            await axios.put('/api/profile', {
                height: height ? parseFloat(height) : null,
            });

            toast({
                title: 'Sucesso',
                description: 'Dados atualizados com sucesso.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            // Update session if possible, or just re-fetch
            fetchProfile();
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            toast({
                title: 'Erro',
                description: 'Erro ao atualizar os dados.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast({
                title: 'Erro',
                description: 'As novas senhas não coincidem.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        if (!currentPassword) {
            toast({
                title: 'Erro',
                description: 'Por favor, informe a senha atual.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setIsLoading(true);
        try {
            await axios.put('/api/profile', {
                currentPassword,
                newPassword
            });

            toast({
                title: 'Sucesso',
                description: 'Senha alterada com sucesso.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Erro ao alterar senha:', error);
            toast({
                title: 'Erro',
                description: error.response?.data?.error || 'Erro ao alterar a senha.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container maxW="container.md" py={8}>
            <VStack spacing={8} align="stretch">
                <Heading size="lg">Meu Perfil</Heading>

                <Box p={6} borderWidth={1} borderRadius="lg" bg="white" _dark={{ bg: 'gray.800' }}>
                    <VStack spacing={4} align="stretch">
                        <Heading size="md">Informações Pessoais</Heading>

                        <FormControl>
                            <FormLabel>Nome</FormLabel>
                            <Input value={name} isReadOnly bg="gray.100" _dark={{ bg: 'gray.700' }} />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Email</FormLabel>
                            <Input value={email} isReadOnly bg="gray.100" _dark={{ bg: 'gray.700' }} />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Tipo de Conta</FormLabel>
                            <Input value={role} isReadOnly bg="gray.100" _dark={{ bg: 'gray.700' }} />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Altura (m)</FormLabel>
                            <Input
                                type="number"
                                step="0.01"
                                value={height}
                                onChange={(e) => setHeight(e.target.value)}
                                placeholder="Ex: 1.75"
                            />
                        </FormControl>

                        <Divider my={2} />

                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                            <VStack align="start" spacing={0}>
                                <FormLabel mb="0">Tema da Interface</FormLabel>
                                <Text fontSize="sm" color="gray.500">
                                    Padrão atual: {isDarkMode ? 'Escuro (Dark Mode)' : 'Claro (Light Mode)'}
                                </Text>
                            </VStack>
                            <Switch isChecked={isDarkMode} onChange={toggleTheme} colorScheme="blue" size="lg" />
                        </FormControl>

                        <Button colorScheme="blue" onClick={handleUpdateProfile} isLoading={isLoading}>
                            Salvar Alterações
                        </Button>
                    </VStack>
                </Box>

                <Box p={6} borderWidth={1} borderRadius="lg" bg="white" _dark={{ bg: 'gray.800' }}>
                    <VStack spacing={4} align="stretch">
                        <Heading size="md" color="red.500">Alterar Senha</Heading>
                        <Divider />

                        <FormControl>
                            <FormLabel>Senha Atual</FormLabel>
                            <InputGroup>
                                <Input
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                />
                                <InputRightElement width="4.5rem">
                                    <Button h="1.75rem" size="sm" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                                        {showCurrentPassword ? <ViewOffIcon /> : <ViewIcon />}
                                    </Button>
                                </InputRightElement>
                            </InputGroup>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Nova Senha</FormLabel>
                            <InputGroup>
                                <Input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <InputRightElement width="4.5rem">
                                    <Button h="1.75rem" size="sm" onClick={() => setShowNewPassword(!showNewPassword)}>
                                        {showNewPassword ? <ViewOffIcon /> : <ViewIcon />}
                                    </Button>
                                </InputRightElement>
                            </InputGroup>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Confirmar Nova Senha</FormLabel>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </FormControl>

                        <Button colorScheme="red" variant="outline" onClick={handleChangePassword} isLoading={isLoading}>
                            Atualizar Senha
                        </Button>
                    </VStack>
                </Box>
            </VStack>
        </Container>
    );
}
