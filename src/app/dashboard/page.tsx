'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Image,
  Link,
  Button,
  Collapse,
  useDisclosure,
  Select,
  useColorModeValue,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
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

interface Photo {
  id: string;
  url: string;
  angle: string;
  date: string;
}

const ANGLE_LABELS = {
  FRONT: 'Frente',
  BACK: 'Costas',
  LEFT: 'Lado Esquerdo',
  RIGHT: 'Lado Direito',
  BICEPS: 'Bíceps',
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lastMeasurement, setLastMeasurement] = useState<Measurement | null>(null);
  const [lastPhoto, setLastPhoto] = useState<Photo | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const { isOpen: isGraphOpen, onToggle: onGraphToggle } = useDisclosure();
  const [selectedMetric, setSelectedMetric] = useState('weight');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (status !== 'authenticated') return;
      
      try {
        console.log('Iniciando busca de dados no dashboard...');
        const [measurementsResponse, photosResponse] = await Promise.all([
          axios.get('/api/measurements', {
            headers: {
              'Content-Type': 'application/json',
            },
            withCredentials: true,
          }),
          axios.get('/api/photos', {
            headers: {
              'Content-Type': 'application/json',
            },
            withCredentials: true,
          }),
        ]);

        const measurements = measurementsResponse.data;
        const photos = photosResponse.data;

        console.log('Medições recebidas no dashboard:', measurements);
        console.log('Fotos recebidas no dashboard:', photos);

        if (measurements && measurements.length > 0) {
          const sortedMeasurements = [...measurements].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          
          console.log('Medições ordenadas:', sortedMeasurements);
          setLastMeasurement(sortedMeasurements[0]);
          setMeasurements(sortedMeasurements);
        }

        if (photos && photos.length > 0) {
          setLastPhoto(photos[0]);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      }
    };

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toLocaleDateString('pt-BR');
  };

  const getChartData = () => {
    if (!measurements || measurements.length === 0) {
      console.log('Sem medições para exibir no gráfico');
      return {
        labels: [],
        datasets: [{
          label: 'Sem dados',
          data: [],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        }]
      };
    }

    console.log('Preparando dados do gráfico com medições:', measurements);

    const sortedMeasurements = [...measurements].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const labels = sortedMeasurements.map(m => formatDate(m.date));

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
    }).filter(value => value !== null);

    console.log('Dados do gráfico preparados:', { labels, data });

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
        ticks: {
          callback: function(value: any) {
            return value + (selectedMetric === 'weight' ? ' kg' : ' cm');
          }
        }
      },
    },
  };

  if (status === 'loading') {
    return (
      <Container maxW="container.xl" py={10}>
        <Text>Carregando...</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg">Bem-vindo, {session?.user?.name}</Heading>
          <Text mt={2} color="gray.600">
            Acompanhe sua evolução física
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Box p={6} bg={useColorModeValue('white', 'gray.800')} borderRadius="lg" boxShadow="sm">
            <Heading size="md" mb={4}>Peso Atual</Heading>
            <Text fontSize="2xl" fontWeight="bold">
              {lastMeasurement ? `${lastMeasurement.weight} kg` : 'N/A'}
            </Text>
            {lastMeasurement && (
              <Text fontSize="sm" color="gray.500">
                Última medição: {formatDate(lastMeasurement.date)}
              </Text>
            )}
          </Box>

          <Stat
            px={4}
            py={5}
            shadow="base"
            borderColor="gray.200"
            rounded="lg"
            bg={useColorModeValue('white', 'gray.800')}
          >
            <StatLabel>Última Medição</StatLabel>
            <StatNumber>
              {lastMeasurement ? formatDate(lastMeasurement.date) : '--'}
            </StatNumber>
            <StatHelpText>
              {lastMeasurement ? (
                <Link href="/dashboard/measurements" color="blue.500">
                  Ver histórico
                </Link>
              ) : (
                'Nenhuma medição registrada'
              )}
            </StatHelpText>
          </Stat>

          <Stat
            px={4}
            py={5}
            shadow="base"
            borderColor="gray.200"
            rounded="lg"
            bg={useColorModeValue('white', 'gray.800')}
          >
            <StatLabel>Última Foto</StatLabel>
            <StatNumber>
              {lastPhoto
                ? ANGLE_LABELS[lastPhoto.angle as keyof typeof ANGLE_LABELS]
                : '--'}
            </StatNumber>
            <StatHelpText>
              {lastPhoto ? (
                <Link href="/dashboard/photos" color="blue.500">
                  Ver galeria
                </Link>
              ) : (
                'Nenhuma foto registrada'
              )}
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
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

          <Box
            p={6}
            shadow="base"
            borderColor="gray.200"
            rounded="lg"
            bg={useColorModeValue('white', 'gray.800')}
          >
            <Heading size="md" mb={4}>
              Próximos Passos
            </Heading>
            <VStack align="stretch" spacing={4}>
              <Link href="/dashboard/measurements" color="blue.500">
                Registrar nova medição
              </Link>
              <Link href="/dashboard/photos" color="blue.500">
                Adicionar nova foto
              </Link>
            </VStack>
          </Box>
        </SimpleGrid>
      </VStack>
    </Container>
  );
} 