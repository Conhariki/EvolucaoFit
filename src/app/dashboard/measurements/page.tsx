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
} from '@chakra-ui/react';
import { useStudent } from '@/contexts/StudentContext';
import { EditIcon, DeleteIcon, CheckIcon, CloseIcon, AddIcon } from '@chakra-ui/icons';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MeasurementValue {
  typeId: string;
  value: number;
  type: {
    id: string;
    name: string;
  };
}

interface Measurement {
  id: string;
  weight: number;
  date: string;
  values: MeasurementValue[];
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
  const { selectedStudentId } = useStudent();
  const [isLoading, setIsLoading] = useState(false);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [measurementTypes, setMeasurementTypes] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState('weight');
  const [formData, setFormData] = useState({
    weight: '',
    date: '',
  });
  const [measurementValues, setMeasurementValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchMeasurementTypes = async () => {
      try {
        const response = await axios.get('/api/measurement-types', {
          withCredentials: true,
        });
        setMeasurementTypes(response.data);
      } catch (error) {
        console.error('Erro ao carregar tipos de medidas:', error);
      }
    };

    fetchMeasurementTypes();
  }, []);

  useEffect(() => {
    const fetchMeasurements = async () => {
      if (status !== 'authenticated') return;

      try {
        setIsLoading(true);
        const url = selectedStudentId ? `/api/measurements?studentId=${selectedStudentId}` : '/api/measurements';
        const response = await axios.get(url, {
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
  }, [status, toast, selectedStudentId]);

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

      // const studentId = sessionStorage.getItem('selectedStudentId'); // Removed
      // Use selectedStudentId from context instead
      const measurementValuesData = Object.entries(measurementValues)
        .filter(([_, value]) => value && value !== '')
        .map(([typeId, value]) => ({
          typeId,
          value: parseFloat(value),
        }));

      const data = {
        weight: parseFloat(formData.weight),
        date: formData.date,
        time: currentTime,
        studentId: selectedStudentId || null,
        measurementValues: measurementValuesData,
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
        date: '',
      });
      setMeasurementValues({});
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
      date: localDate.toISOString().split('T')[0],
    });

    // Populate measurement values for dynamic fields
    const newValues: Record<string, string> = {};
    measurement.values.forEach(v => {
      newValues[v.typeId] = v.value.toString();
    });
    setMeasurementValues(newValues);
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
      if (selectedMetric === 'weight') {
        return m.weight;
      }
      const val = m.values.find(v => v.typeId === selectedMetric);
      return val ? val.value : null;
    });

    const selectedType = measurementTypes.find(t => t.id === selectedMetric);
    const label = selectedMetric === 'weight' ? 'Peso (kg)' : `${selectedType?.name || 'Valor'} (cm)`;

    return {
      labels,
      datasets: [
        {
          label,
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
      <VStack spacing={8} align="stretch">
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Medições</Heading>
          <HStack spacing={4}>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="teal"
              onClick={handleNewMeasurement}
            >
              Nova Medição
            </Button>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="teal"
              onClick={onGraphToggle}
            >
              {isGraphOpen ? 'Ocultar Gráfico' : 'Visualizar Gráfico'}
            </Button>
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

                  {measurementTypes.map((type) => (
                    <FormControl key={type.id}>
                      <FormLabel>{type.name} (cm)</FormLabel>
                      <Input
                        type="number"
                        step="0.1"
                        value={measurementValues[type.id] || ''}
                        onChange={(e) =>
                          setMeasurementValues({
                            ...measurementValues,
                            [type.id]: e.target.value,
                          })
                        }
                        placeholder={`Ex: ${type.description || 'valor'}`}
                      />
                    </FormControl>
                  ))}

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
            <Box p={4} bg={useColorModeValue('white', 'gray.800')} borderRadius="lg" boxShadow="sm">
              <Box mb={4}>
                <Select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  maxW="200px"
                >
                  <option value="weight">Peso</option>
                  {measurementTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </Select>
              </Box>
              <Line options={chartOptions} data={getChartData()} />
            </Box>
          </Collapse>
        </Box>

        <Box>
          <Heading size="md" mb={4}>
            Histórico de Medições
          </Heading>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Data</Th>
                  <Th isNumeric>Peso</Th>
                  {measurementTypes.map(type => (
                    <Th key={type.id} isNumeric>{type.name}</Th>
                  ))}
                  <Th>Ações</Th>
                </Tr>
              </Thead>
              <Tbody>
                {measurements.map((measurement) => {
                  const measurementDate = new Date(measurement.date);
                  // Ajusta a data para o fuso horário local
                  const localDate = new Date(measurementDate.getTime() - measurementDate.getTimezoneOffset() * 60000);

                  return (
                    <Tr key={measurement.id}>
                      <Td>{localDate.toLocaleDateString('pt-BR')}</Td>
                      <Td isNumeric>{measurement.weight} kg</Td>
                      {measurementTypes.map(type => {
                        const val = measurement.values.find(v => v.typeId === type.id);
                        return (
                          <Td key={type.id} isNumeric>
                            {val ? `${val.value} cm` : '-'}
                          </Td>
                        );
                      })}
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="Editar medição"
                            icon={<EditIcon />}
                            size="sm"
                            onClick={() => handleEdit(measurement)}
                          />
                          <IconButton
                            aria-label="Excluir medição"
                            icon={<DeleteIcon />}
                            size="sm"
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
        </Box>
      </VStack>
    </Container>
  );
} 