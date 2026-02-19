'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  VStack,
  Button,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Select,
  FormControl,
  FormLabel,
  Text,
  Input,
  useColorModeValue,
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import axios from 'axios';

interface Student {
  id: string;
  name: string;
  email: string;
  role: string;
  height?: number;
  gender?: string;
}

export default function StudentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const [students, setStudents] = useState<Student[]>([]);
  const [allUsers, setAllUsers] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchStudents();
      if (session?.user?.role === 'PROFESSOR') {
        fetchAllUsers();
      }
    }
  }, [status, session]);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/api/students', {
        withCredentials: true,
      });
      setStudents(response.data);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os alunos',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchAllUsers = async () => {
    try {
      // Buscar todos os usuários que são alunos e não estão vinculados
      const response = await axios.get('/api/users?role=ALUNO', {
        withCredentials: true,
      });
      setAllUsers(response.data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const handleLink = async () => {
    if (!selectedStudentId) {
      toast({
        title: 'Erro',
        description: 'Selecione um aluno',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(
        '/api/students',
        { studentId: selectedStudentId },
        { withCredentials: true }
      );
      toast({
        title: 'Sucesso',
        description: 'Aluno vinculado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setSelectedStudentId('');
      fetchStudents();
      fetchAllUsers();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Não foi possível vincular o aluno',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!deleteStudentId) return;

    try {
      await axios.delete(`/api/students?studentId=${deleteStudentId}`, {
        withCredentials: true,
      });
      toast({
        title: 'Sucesso',
        description: 'Aluno desvinculado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setDeleteStudentId(null);
      onClose();
      fetchStudents();
      fetchAllUsers();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Não foi possível desvincular o aluno',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (status === 'loading') {
    return <Container maxW="container.xl" py={10}>Carregando...</Container>;
  }

  if (session?.user?.role !== 'PROFESSOR') {
    return (
      <Container maxW="container.xl" py={6}>
        <VStack spacing={4} align="stretch">
          <Heading size="lg">Meus Dados</Heading>
          <Text>Apenas professores podem gerenciar alunos.</Text>
        </VStack>
      </Container>
    );
  }

  const availableStudents = allUsers.filter(
    (user) => !students.some((s) => s.id === user.id)
  );

  /* State for Edit Modal */
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose
  } = useDisclosure();
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editGender, setEditGender] = useState('MASCULINO');

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setEditName(student.name);
    setEditHeight(student.height ? student.height.toString() : '');
    setEditGender(student.gender || 'MASCULINO');
    onEditOpen();
  };

  const handleSaveEdit = async () => {
    if (!editingStudent || !editName) return;
    setIsLoading(true);
    try {
      await axios.put('/api/students', {
        id: editingStudent.id,
        name: editName,
        height: editHeight,
        gender: editGender
      });
      toast({
        title: 'Sucesso',
        description: 'Dados do aluno atualizados.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onEditClose();
      fetchStudents();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar aluno.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* Novo estado para o modal de cadastro */
  const {
    isOpen: isRegisterOpen,
    onOpen: onRegisterOpen,
    onClose: onRegisterClose
  } = useDisclosure();

  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [newStudentGender, setNewStudentGender] = useState('MASCULINO');

  const handleRegister = async () => {
    if (!newStudentName || !newStudentEmail || !newStudentPassword) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      await axios.post('/api/students/create', {
        name: newStudentName,
        email: newStudentEmail,
        password: newStudentPassword,
        gender: newStudentGender,
      });

      toast({
        title: 'Sucesso',
        description: 'Aluno cadastrado e vinculado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setNewStudentName('');
      setNewStudentEmail('');
      setNewStudentPassword('');
      onRegisterClose();
      fetchStudents();
      fetchAllUsers();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao cadastrar aluno',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* ... código anterior ... */

  return (
    <Container maxW="container.xl" py={6}>
      <VStack spacing={6} align="stretch">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="lg">Vínculo Profissional x Aluno</Heading>
          <Button colorScheme="green" onClick={onRegisterOpen}>
            Cadastrar Novo Aluno
          </Button>
        </Box>

        <Box bg={bgColor} borderRadius="lg" boxShadow="sm" p={4} borderWidth="1px" borderColor={borderColor}>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Vincular Aluno Existente</FormLabel>
              <Select
                placeholder="Selecione um aluno"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                {availableStudents.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </Select>
            </FormControl>
            <Button
              colorScheme="blue"
              onClick={handleLink}
              isLoading={isLoading}
              isDisabled={!selectedStudentId}
            >
              Vincular Aluno
            </Button>
          </VStack>
        </Box>

        <Box bg={bgColor} borderRadius="lg" boxShadow="sm" p={4} borderWidth="1px" borderColor={borderColor}>
          <Heading size="md" mb={4}>Alunos Vinculados</Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Nome</Th>
                <Th>Email</Th>
                <Th>Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {students.length === 0 ? (
                <Tr>
                  <Td colSpan={3} textAlign="center">
                    Nenhum aluno vinculado
                  </Td>
                </Tr>
              ) : (
                students.map((student) => (
                  <Tr key={student.id}>
                    <Td>{student.name}</Td>
                    <Td>{student.email}</Td>
                    <Td>
                      <IconButton
                        aria-label="Editar"
                        icon={<EditIcon />}
                        size="sm"
                        mr={2}
                        onClick={() => handleOpenEdit(student)}
                      />
                      <IconButton
                        aria-label="Desvincular"
                        icon={<DeleteIcon />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => {
                          setDeleteStudentId(student.id);
                          onOpen();
                        }}
                      />
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>

        {/* Modal de Desvínculo */}
        <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={undefined}
          onClose={onClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Desvincular Aluno
              </AlertDialogHeader>
              <AlertDialogBody>
                Tem certeza que deseja desvincular este aluno?
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button onClick={onClose}>Cancelar</Button>
                <Button colorScheme="red" onClick={handleUnlink} ml={3}>
                  Desvincular
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>

        {/* Modal de Cadastro de Novo Aluno */}
        <AlertDialog
          isOpen={isRegisterOpen}
          leastDestructiveRef={undefined}
          onClose={onRegisterClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Cadastrar Novo Aluno
              </AlertDialogHeader>
              <AlertDialogBody>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Nome</FormLabel>
                    <Input
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      placeholder="Nome completo"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={newStudentEmail}
                      onChange={(e) => setNewStudentEmail(e.target.value)}
                      placeholder="Email"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Senha Provisória</FormLabel>
                    <Input
                      type="text"
                      value={newStudentPassword}
                      onChange={(e) => setNewStudentPassword(e.target.value)}
                      placeholder="Senha"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Gênero</FormLabel>
                    <Select
                      value={newStudentGender}
                      onChange={(e) => setNewStudentGender(e.target.value)}
                    >
                      <option value="MASCULINO">Masculino</option>
                      <option value="FEMININO">Feminino</option>
                    </Select>
                  </FormControl>
                </VStack>
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button onClick={onRegisterClose}>Cancelar</Button>
                <Button colorScheme="green" onClick={handleRegister} ml={3} isLoading={isLoading}>
                  Cadastrar e Vincular
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>

        {/* Modal de Edição de Aluno */}
        <AlertDialog
          isOpen={isEditOpen}
          leastDestructiveRef={undefined}
          onClose={onEditClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Editar Aluno
              </AlertDialogHeader>
              <AlertDialogBody>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Nome</FormLabel>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Altura (m)</FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      value={editHeight}
                      onChange={(e) => setEditHeight(e.target.value)}
                      placeholder="Ex: 1.75"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Gênero</FormLabel>
                    <Select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value)}
                    >
                      <option value="MASCULINO">Masculino</option>
                      <option value="FEMININO">Feminino</option>
                    </Select>
                  </FormControl>
                </VStack>
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button onClick={onEditClose}>Cancelar</Button>
                <Button colorScheme="blue" onClick={handleSaveEdit} ml={3} isLoading={isLoading}>
                  Salvar
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </VStack>
    </Container>
  );
}

