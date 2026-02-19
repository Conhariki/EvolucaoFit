'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Textarea,
  useColorModeValue,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, AddIcon } from '@chakra-ui/icons';
import axios from 'axios';

interface MeasurementType {
  id: string;
  name: string;
  description: string | null;
}

export default function MeasurementTypesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const [types, setTypes] = useState<MeasurementType[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const cancelRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const response = await axios.get('/api/measurement-types', {
        withCredentials: true,
      });
      setTypes(response.data);
    } catch (error) {
      console.error('Erro ao carregar tipos de medidas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os tipos de medidas',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingId) {
        await axios.put('/api/measurement-types', {
          id: editingId,
          ...formData,
        }, { withCredentials: true });
        toast({
          title: 'Sucesso',
          description: 'Tipo de medida atualizado',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await axios.post('/api/measurement-types', formData, {
          withCredentials: true,
        });
        toast({
          title: 'Sucesso',
          description: 'Tipo de medida criado',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      setFormData({ name: '', description: '' });
      setEditingId(null);
      onClose();
      fetchTypes();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Não foi possível salvar o tipo de medida',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (type: MeasurementType) => {
    setEditingId(type.id);
    setFormData({
      name: type.name,
      description: type.description || '',
    });
    onOpen();
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await axios.delete(`/api/measurement-types?id=${deleteId}`, {
        withCredentials: true,
      });
      toast({
        title: 'Sucesso',
        description: 'Tipo de medida excluído',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setDeleteId(null);
      onDeleteClose();
      fetchTypes();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Não foi possível excluir o tipo de medida',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '' });
    setEditingId(null);
    onClose();
  };

  if (status === 'loading') {
    return <Container maxW="container.xl" py={10}>Carregando...</Container>;
  }

  return (
    <Container maxW="container.xl" py={6}>
      <VStack spacing={6} align="stretch">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="lg">Cadastro de Medidas</Heading>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blue"
            onClick={() => {
              setEditingId(null);
              setFormData({ name: '', description: '' });
              onOpen();
            }}
          >
            Adicionar Medida
          </Button>
        </Box>

        <Box bg={bgColor} borderRadius="lg" boxShadow="sm" p={4} borderWidth="1px" borderColor={borderColor}>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Nome</Th>
                <Th>Descrição</Th>
                <Th>Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {types.map((type) => (
                <Tr key={type.id}>
                  <Td>{type.name}</Td>
                  <Td>{type.description || '-'}</Td>
                  <Td>
                    <IconButton
                      aria-label="Editar"
                      icon={<EditIcon />}
                      size="sm"
                      colorScheme="blue"
                      mr={2}
                      onClick={() => handleEdit(type)}
                    />
                    <IconButton
                      aria-label="Excluir"
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      onClick={() => {
                        setDeleteId(type.id);
                        onDeleteOpen();
                      }}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        <Modal isOpen={isOpen} onClose={handleCancel}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {editingId ? 'Editar Medida' : 'Nova Medida'}
            </ModalHeader>
            <ModalCloseButton />
            <form onSubmit={handleSubmit}>
              <ModalBody>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Nome da Medida</FormLabel>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Ex: Peitoral, Bíceps direito, etc."
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Descrição</FormLabel>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Descrição opcional da medida"
                    />
                  </FormControl>
                </VStack>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button colorScheme="blue" type="submit" isLoading={isLoading}>
                  {editingId ? 'Salvar' : 'Criar'}
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>

        <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Excluir Tipo de Medida
              </AlertDialogHeader>

              <AlertDialogBody>
                Tem certeza que deseja excluir este tipo de medida? Esta ação não pode ser desfeita.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose}>
                  Cancelar
                </Button>
                <Button colorScheme="red" onClick={handleDelete} ml={3}>
                  Excluir
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </VStack>
    </Container>
  );
}

