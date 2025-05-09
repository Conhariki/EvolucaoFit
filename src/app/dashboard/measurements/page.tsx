'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  Text,
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
  TableContainer,
  Spinner,
  Center,
  IconButton,
  HStack,
  Collapse,
  useDisclosure,
  Select,
  Flex,
  useColorModeValue,
  useBreakpointValue,
  Tooltip,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, CheckIcon, CloseIcon, AddIcon } from '@chakra-ui/icons';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { FiBarChart2 } from 'react-icons/fi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

interface Measurement {
  id: string;
  weight: number;
  chest?: number;
  waist?: number;
  hips?: number;
  biceps?: number;
  thighs?: number;
  date: string;
}

interface ApiResponse {
  data: Measurement;
  error?: string;
  details?: string;
}

export default function MeasurementsPage() {
  const { isOpen, onToggle, onClose } = useDisclosure();
  const { isOpen: isGraphOpen, onToggle: onGraphToggle } = useDisclosure();
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState('weight');
  const [formData, setFormData] = useState({
    weight: '',
    chest: '',
    waist: '',
    hips: '',
    biceps: '',
    thighs: '',
    date: '',
  });
  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchMeasurements = async () => {
      if (status !== 'authenticated') return;
      
      try {
        setIsLoading(true);
        const response = await axios.get('/api/measurements', {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        });
        console.log('Medições recebidas:', response.data);
        setMeasurements(response.data);
      } catch (error) {
        console.error('Erro ao carregar medições:', error);
        toast({
          title: 'Erro ao carregar medições',
          description: error instanceof Error ? error.message : 'Não foi possível carregar o histórico de medições.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeasurements();
  }, [status, toast]);

  const formatTimeForInput = (timeString: string) => {
    try {
      // Se o horário já estiver no formato HH:mm, retorna ele mesmo
      if (/^\d{2}:\d{2}$/.test(timeString)) {
        return timeString;
      }
      
      // Tenta extrair horas e minutos de qualquer formato
      const match = timeString.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        const [_, hours, minutes] = match;
        return `${hours.padStart(2, '0')}:${minutes}`;
      }
      
      return '';
    } catch (error) {
      console.error('Erro ao formatar horário:', error);
      return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'authenticated') {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para registrar medições.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      // Obtém o horário atual
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;

      const data = {
        ...formData,
        weight: parseFloat(formData.weight),
        chest: formData.chest ? parseFloat(formData.chest) : undefined,
        waist: formData.waist ? parseFloat(formData.waist) : undefined,
        hips: formData.hips ? parseFloat(formData.hips) : undefined,
        biceps: formData.biceps ? parseFloat(formData.biceps) : undefined,
        thighs: formData.thighs ? parseFloat(formData.thighs) : undefined,
        date: formData.date,
        time: currentTime,
      };

      console.log('Data selecionada:', formData.date);
      console.log('Horário atual:', currentTime);
      console.log('Data para envio:', data.date);

      let response: ApiResponse;
      if (editingId) {
        response = await axios.put('/api/measurements', { ...data, id: editingId }, {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        });
        setMeasurements(measurements.map(m => 
          m.id === editingId ? response.data : m
        ));
      } else {
        response = await axios.post('/api/measurements', data, {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        });
        setMeasurements([response.data, ...measurements]);
      }

      setFormData({
        weight: '',
        chest: '',
        waist: '',
        hips: '',
        biceps: '',
        thighs: '',
        date: '',
      });
      setEditingId(null);
      onClose();

      toast({
        title: editingId ? 'Medição atualizada' : 'Medição registrada',
        description: editingId ? 'Sua medição foi atualizada com sucesso!' : 'Sua medição foi registrada com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erro ao registrar/atualizar medição:', error);
      let errorMessage = 'Ocorreu um erro ao registrar/atualizar sua medição.';

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400 && error.response?.data?.error === 'Já existe uma medição registrada para esta data') {
          errorMessage = 'Já existe uma medição registrada para esta data. Por favor, escolha outra data ou edite a medição existente.';
        } else if (error.response?.data?.details) {
          errorMessage = error.response.data.details;
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: 'Erro',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewMeasurement = () => {
    setEditingId(null);
    const now = new Date();
    // Ajusta a data para o fuso horário local
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    
    setFormData({
      weight: '',
      chest: '',
      waist: '',
      hips: '',
      biceps: '',
      thighs: '',
      date: localDate.toISOString().split('T')[0],
    });
    onToggle();
  };

  const handleEdit = (measurement: Measurement) => {
    setEditingId(measurement.id);
    const measurementDate = new Date(measurement.date);
    
    // Ajusta a data para o fuso horário local
    const localDate = new Date(measurementDate.getTime() - measurementDate.getTimezoneOffset() * 60000);
    
    setFormData({
      weight: measurement.weight.toString(),
      chest: measurement.chest?.toString() || '',
      waist: measurement.waist?.toString() || '',
      hips: measurement.hips?.toString() || '',
      biceps: measurement.biceps?.toString() || '',
      thighs: measurement.thighs?.toString() || '',
      date: localDate.toISOString().split('T')[0],
    });
    onToggle();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      weight: '',
      chest: '',
      waist: '',
      hips: '',
      biceps: '',
      thighs: '',
      date: '',
    });
    onClose();
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/measurements?id=${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });

      setMeasurements(measurements.filter(m => m.id !== id));

      toast({
        title: 'Medição excluída',
        description: 'Sua medição foi excluída com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erro ao excluir medição:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : axios.isAxiosError(error) && error.response?.data?.details
          ? error.response.data.details
          : 'Ocorreu um erro ao excluir sua medição.';

      toast({
        title: 'Erro ao excluir medição',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getChartData = () => {
    const sortedMeasurements = [...measurements].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const labels = sortedMeasurements.map(m => 
      new Date(m.date).toLocaleDateString('pt-BR')
    );

    const data = sortedMeasurements.map(m => {
      switch (selectedMetric) {
        case 'weight':
          return m.weight;
        case 'chest':
          return m.chest || null;
        case 'waist':
          return m.waist || null;
        case 'hips':
          return m.hips || null;
        case 'biceps':
          return m.biceps || null;
        case 'thighs':
          return m.thighs || null;
        default:
          return m.weight;
      }
    });

    const metricLabels = {
      weight: 'Peso (kg)',
      chest: 'Peito (cm)',
      waist: 'Cintura (cm)',
      hips: 'Quadril (cm)',
      biceps: 'Bíceps (cm)',
      thighs: 'Coxas (cm)',
    };

    return {
      labels,
      datasets: [
        {
          label: metricLabels[selectedMetric as keyof typeof metricLabels],
          data,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Evolução das Medições',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  if (status === 'loading') {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={4} align="stretch">
        <Flex justify="space-between" align="center" mb={2} flexWrap={{ base: 'wrap', md: 'nowrap' }} gap={2}>
          <Heading size="lg">Medições</Heading>
          <HStack spacing={2} flexWrap={{ base: 'wrap', md: 'nowrap' }}>
            {isMobile ? (
              <>
                <Tooltip label="Nova Medição">
                  <IconButton
                    aria-label="Nova Medição"
                    icon={<AddIcon />}
                    colorScheme="teal"
                    onClick={handleNewMeasurement}
                    size="sm"
                    variant="ghost"
                    isRound
                  />
                </Tooltip>
                <Tooltip label={isGraphOpen ? 'Ocultar Gráfico' : 'Visualizar Gráfico'}>
                  <IconButton
                    aria-label="Gráfico"
                    icon={<FiBarChart2 />}
                    colorScheme="teal"
                    onClick={onGraphToggle}
                    size="sm"
                    variant="ghost"
                    isRound
                  />
                </Tooltip>
              </>
            ) : (
              <>
                <Button
                  leftIcon={<AddIcon />}
                  colorScheme="teal"
                  onClick={handleNewMeasurement}
                  size="md"
                >
                  Nova Medição
                </Button>
                <Button
                  leftIcon={<FiBarChart2 />}
                  colorScheme="teal"
                  onClick={onGraphToggle}
                  size="md"
                >
                  {isGraphOpen ? 'Ocultar Gráfico' : 'Visualizar Gráfico'}
                </Button>
              </>
            )}
          </HStack>
        </Flex>

        <Box>
          <Collapse in={isOpen} animateOpacity>
            <Box
              p={6}
              shadow="base"
              borderColor="gray.200"
              rounded="lg"
              bg={useColorModeValue('white', 'gray.800')}
              mb={8}
            >
              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Data</FormLabel>
                    <Input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Peso (kg)</FormLabel>
                    <Input
                      type="number"
                      step="0.1"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      placeholder="Ex: 75.5"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Peito (cm)</FormLabel>
                    <Input
                      type="number"
                      step="0.1"
                      name="chest"
                      value={formData.chest}
                      onChange={handleChange}
                      placeholder="Ex: 95"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Cintura (cm)</FormLabel>
                    <Input
                      type="number"
                      step="0.1"
                      name="waist"
                      value={formData.waist}
                      onChange={handleChange}
                      placeholder="Ex: 80"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Quadril (cm)</FormLabel>
                    <Input
                      type="number"
                      step="0.1"
                      name="hips"
                      value={formData.hips}
                      onChange={handleChange}
                      placeholder="Ex: 90"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Bíceps (cm)</FormLabel>
                    <Input
                      type="number"
                      step="0.1"
                      name="biceps"
                      value={formData.biceps}
                      onChange={handleChange}
                      placeholder="Ex: 35"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Coxas (cm)</FormLabel>
                    <Input
                      type="number"
                      step="0.1"
                      name="thighs"
                      value={formData.thighs}
                      onChange={handleChange}
                      placeholder="Ex: 55"
                    />
                  </FormControl>

                  <HStack spacing={4} width="100%">
                    <Button
                      type="submit"
                      colorScheme={editingId ? "green" : "blue"}
                      width="100%"
                      isLoading={isLoading}
                    >
                      {editingId ? "Salvar Alterações" : "Registrar Medição"}
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      width="100%"
                      variant="outline"
                    >
                      Cancelar
                    </Button>
                  </HStack>
                </VStack>
              </form>
            </Box>
          </Collapse>
        </Box>

        <Box>
          <Collapse in={isGraphOpen} animateOpacity>
            <Box p={4} bg={useColorModeValue('white', 'gray.800')} borderRadius="lg" boxShadow="sm" width="100%">
              <Box mb={4}>
                <Select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  maxW="200px"
                >
                  <option value="weight">Peso</option>
                  <option value="chest">Peito</option>
                  <option value="waist">Cintura</option>
                  <option value="hips">Quadril</option>
                  <option value="biceps">Bíceps</option>
                  <option value="thighs">Coxas</option>
                </Select>
              </Box>
              <Box height={{ base: '200px', md: '250px' }} width="100%">
                <Line options={chartOptions} data={getChartData()} />
              </Box>
            </Box>
          </Collapse>
        </Box>

        <Box>
          {!isMobile && (
            <Heading size="md" mb={4}>
              Histórico de Medições
            </Heading>
          )}
          {isMobile ? (
            <VStack spacing={4} align="stretch">
              {measurements.map((measurement) => {
                const measurementDate = new Date(measurement.date);
                const localDate = new Date(measurementDate.getTime() - measurementDate.getTimezoneOffset() * 60000);
                return (
                  <Box key={measurement.id} p={4} borderWidth="1px" borderRadius="md" bg={useColorModeValue('white', 'gray.700')}>
                    <Flex justify="space-between" align="flex-start" mb={2}>
                      <Text fontWeight="bold">{localDate.toLocaleDateString('pt-BR')}</Text>
                      <HStack spacing={1}>
                        <IconButton
                          aria-label="Editar"
                          icon={<EditIcon />}
                          size="xs"
                          variant="ghost"
                          colorScheme="gray"
                          onClick={() => handleEdit(measurement)}
                        />
                        <IconButton
                          aria-label="Excluir"
                          icon={<DeleteIcon />}
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleDelete(measurement.id)}
                        />
                      </HStack>
                    </Flex>
                    <Text><b>Peso:</b> {measurement.weight} kg</Text>
                    <Text><b>Peito:</b> {measurement.chest || '-'} cm</Text>
                    <Text><b>Cintura:</b> {measurement.waist || '-'} cm</Text>
                    <Text><b>Quadril:</b> {measurement.hips || '-'} cm</Text>
                    <Text><b>Bíceps:</b> {measurement.biceps || '-'} cm</Text>
                    <Text><b>Coxas:</b> {measurement.thighs || '-'} cm</Text>
                  </Box>
                );
              })}
            </VStack>
          ) : (
            <TableContainer overflowX="auto">
              <Table variant="simple" minW={{ base: '700px', md: '100%' }} size={{ base: 'sm', md: 'md' }}>
                <Thead>
                  <Tr>
                    <Th fontSize={{ base: 'xs', md: 'sm' }}>Data</Th>
                    <Th isNumeric fontSize={{ base: 'xs', md: 'sm' }}>Peso</Th>
                    <Th isNumeric fontSize={{ base: 'xs', md: 'sm' }}>Peito</Th>
                    <Th isNumeric fontSize={{ base: 'xs', md: 'sm' }}>Cintura</Th>
                    <Th isNumeric fontSize={{ base: 'xs', md: 'sm' }}>Quadril</Th>
                    <Th isNumeric fontSize={{ base: 'xs', md: 'sm' }}>Bíceps</Th>
                    <Th isNumeric fontSize={{ base: 'xs', md: 'sm' }}>Coxas</Th>
                    <Th fontSize={{ base: 'xs', md: 'sm' }}>Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {measurements.map((measurement) => {
                    const measurementDate = new Date(measurement.date);
                    const localDate = new Date(measurementDate.getTime() - measurementDate.getTimezoneOffset() * 60000);
                    return (
                      <Tr key={measurement.id}>
                        <Td fontSize={{ base: 'xs', md: 'sm' }}>{localDate.toLocaleDateString('pt-BR')}</Td>
                        <Td isNumeric fontSize={{ base: 'xs', md: 'sm' }}>{measurement.weight} kg</Td>
                        <Td isNumeric fontSize={{ base: 'xs', md: 'sm' }}>{measurement.chest || '-'} cm</Td>
                        <Td isNumeric fontSize={{ base: 'xs', md: 'sm' }}>{measurement.waist || '-'} cm</Td>
                        <Td isNumeric fontSize={{ base: 'xs', md: 'sm' }}>{measurement.hips || '-'} cm</Td>
                        <Td isNumeric fontSize={{ base: 'xs', md: 'sm' }}>{measurement.biceps || '-'} cm</Td>
                        <Td isNumeric fontSize={{ base: 'xs', md: 'sm' }}>{measurement.thighs || '-'} cm</Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              aria-label="Editar medição"
                              icon={<EditIcon />}
                              size={{ base: 'xs', md: 'sm' }}
                              onClick={() => handleEdit(measurement)}
                            />
                            <IconButton
                              aria-label="Excluir medição"
                              icon={<DeleteIcon />}
                              size={{ base: 'xs', md: 'sm' }}
                              colorScheme="red"
                              onClick={() => handleDelete(measurement.id)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </VStack>
    </Container>
  );
} 