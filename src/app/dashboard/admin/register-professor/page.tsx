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
    Select,
} from '@chakra-ui/react';
import axios from 'axios';
import { useSession } from 'next-auth/react';

export default function RegisterProfessorPage() {
    const { data: session } = useSession();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'PROFESSOR' | 'ALUNO'>('PROFESSOR');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const toast = useToast();

    if (session?.user?.email !== 'felipe.conhariki@gmail.com') {
        return (
            <Container maxW="container.sm" py={10}>
                <Heading color="red.500">Acesso Negado</Heading>
                <Text>Apenas o administrador pode acessar esta página.</Text>
            </Container>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Using the same register API but authenticated as admin
            await axios.post('/api/auth/register', {
                name,
                email,
                password,
                role,
            });

            toast({
                title: 'Professor registrado com sucesso!',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });

            // Reset form
            setName('');
            setEmail('');
            setPassword('');

        } catch (error: any) {
            toast({
                title: 'Erro ao registrar professor',
                description: error.response?.data?.message || 'Ocorreu um erro ao criar a conta.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container maxW="container.md" py={10}>
            <VStack spacing={8} align="stretch">
                <Heading size="lg">Registrar Novo Professor</Heading>
                <Text>Adicione um novo professor ao sistema.</Text>

                <Box w="100%" p={8} borderWidth={1} borderRadius="lg" bg="white" _dark={{ bg: 'gray.800' }}>
                    <form onSubmit={handleSubmit}>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Nome</FormLabel>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nome completo do professor"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Email</FormLabel>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="professor@email.com"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Senha Inicial</FormLabel>
                                <Input
                                    type="text" // Visible password for manual registration
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Senha forte"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Tipo de Conta</FormLabel>
                                <Select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as 'PROFESSOR' | 'ALUNO')}
                                    isDisabled
                                >
                                    <option value="PROFESSOR">Professor</option>
                                    <option value="ALUNO">Aluno</option>
                                </Select>
                            </FormControl>

                            <Button
                                type="submit"
                                colorScheme="blue"
                                width="100%"
                                isLoading={isLoading}
                            >
                                Registrar Professor
                            </Button>
                        </VStack>
                    </form>
                </Box>
            </VStack>
        </Container>
    );
}
