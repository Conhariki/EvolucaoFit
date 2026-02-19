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
  Tooltip,
} from '@chakra-ui/react';
import { InfoOutlineIcon } from '@chakra-ui/icons';
import { AddIcon } from '@chakra-ui/icons';
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
import { useStudent } from '@/contexts/StudentContext';
import { calculateBMI, calculateBodyFat, calculateBodyFat7Site, getBMICategory } from '@/utils/healthMetrics';
import DashboardLoading from './loading';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

interface MeasurementValue {
  id: string;
  value: number;
  type: {
    id: string;
    name: string;
  };
}

interface Measurement {
  id: string;
  weight: number;
  chest?: number;
  waist?: number;
  hips?: number;
  biceps?: number;
  thighs?: number;
  date: string;
  values: MeasurementValue[];
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
  const { selectedStudentId, students } = useStudent();
  const selectedStudent = students.find(s => s.id === selectedStudentId) || (session?.user as any); // Fallback to session user if standard user
  const [measurementTypes, setMeasurementTypes] = useState<any[]>([]);
  const [bodyFatMethod, setBodyFatMethod] = useState<'navy' | '7site'>('navy');
  const [isLoading, setIsLoading] = useState(true);

  // Hook calls must be unconditional
  const cardBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    const fetchMeasurementTypes = async () => {
      try {
        const response = await axios.get('/api/measurement-types', {
          withCredentials: true,
        });
        setMeasurementTypes(response.data);
      } catch (error) {
        console.error('Erro ao buscar tipos de medidas:', error);
      }
    };
    if (status === 'authenticated') {
      fetchMeasurementTypes();
    }
  }, [status]);

  const bmi = lastMeasurement && selectedStudent?.height
    ? calculateBMI(lastMeasurement.weight, selectedStudent.height)
    : null;

  const bmiCategory = bmi ? getBMICategory(bmi) : '';

  const calculateUserBodyFat = () => {
    if (!lastMeasurement || !selectedStudent?.gender || !selectedStudent?.height) return null;

    if (bodyFatMethod === 'navy') {
      const waist = lastMeasurement.values?.find(v => v.type.name === 'Cintura')?.value;
      const neck = lastMeasurement.values?.find(v => v.type.name === 'Pescoço')?.value;
      const hip = lastMeasurement.values?.find(v => v.type.name === 'Quadril')?.value;
      const waistFinal = waist || lastMeasurement.waist;

      return calculateBodyFat(
        selectedStudent.gender,
        waistFinal || 0,
        neck || 0,
        hip || 0,
        selectedStudent.height
      );
    } else {
      // 7-site
      const getVal = (name: string) => lastMeasurement.values?.find(v => v.type.name === name || v.type.name === `Dobra Cutânea - ${name}`)?.value || 0;

      // Mapping simple names to possible DB names (adjust if seed names are different)
      const chest = getVal('Peitoral') || getVal('Peito'); // 'Dobra Cutânea - Peitoral' or legacy 'Peito'
      const axilla = getVal('Axilar Média');
      const tricep = getVal('Tríceps');
      const subscapular = getVal('Subescapular');
      const abdomen = getVal('Abdominal') || getVal('Abdômen'); // check seed
      const suprailiac = getVal('Suprailíaca');
      const thigh = getVal('Coxa') || getVal('Coxas');

      // Age is needed. If not birthDate, maybe default or cannot calc?
      // Using birthDate from student/user
      const birthDate = selectedStudent.birthDate ? new Date(selectedStudent.birthDate) : null;
      let age = 25; // Default fallback? Or return null?
      if (birthDate) {
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      } else {
        return null; // Cannot calc without age
      }

      return calculateBodyFat7Site(
        selectedStudent.gender,
        { chest, axilla, tricep, subscapular, abdomen, suprailiac, thigh },
        age
      );
    }
  };

  const bodyFat = calculateUserBodyFat();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (status !== 'authenticated') return;

      setIsLoading(true);
      try {
        console.log('Iniciando busca de dados no dashboard...', { selectedStudentId });

        const queryParams = selectedStudentId ? `?studentId=${selectedStudentId}` : '';

        const [measurementsResponse, photosResponse] = await Promise.all([
          axios.get(`/api/measurements${queryParams}`, {
            headers: {
              'Content-Type': 'application/json',
            },
            withCredentials: true,
          }),
          axios.get(`/api/photos${queryParams}`, {
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
        } else {
          setLastMeasurement(null);
          setMeasurements([]);
        }

        if (photos && photos.length > 0) {
          setLastPhoto(photos[0]);
        } else {
          setLastPhoto(null);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, selectedStudentId]);

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
      if (selectedMetric === 'weight') {
        return m.weight;
      }
      const val = m.values.find(v => v.type.id === selectedMetric || v.type.name === selectedMetric); // Support both ID and Name for legacy/hybrid
      // Fallback for hardcoded fields during migration if needed, but 'values' is preferred
      return val ? val.value : null;
    });

    console.log('Dados do gráfico preparados:', { labels, data });

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
        ticks: {
          callback: function (value: any) {
            return value + (selectedMetric === 'weight' ? ' kg' : ' cm');
          }
        }
      },
    },
  };

  if (status === 'loading' || isLoading) {
    return <DashboardLoading />;
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
          <Box p={6} bg={cardBg} borderRadius="lg" boxShadow="sm">
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
            bg={cardBg}
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
            bg={cardBg}
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

        {/* Health Metrics Section */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Box p={6} bg={cardBg} borderRadius="lg" boxShadow="sm">
            <Heading size="md" mb={4}>IMC (Índice de Massa Corporal)</Heading>
            <SimpleGrid columns={2} spacing={4}>
              <Box>
                <Text color="gray.500" fontSize="sm">Atual</Text>
                <Text fontSize="3xl" fontWeight="bold">
                  {bmi || '--'}
                </Text>
              </Box>
              <Box>
                <Text color="gray.500" fontSize="sm">Classificação</Text>
                <Text fontSize="lg" fontWeight="medium" color={bmi && bmi > 24.9 ? 'orange.500' : 'green.500'}>
                  {bmiCategory || '--'}
                </Text>
              </Box>
            </SimpleGrid>
          </Box>

          <Box p={6} bg={cardBg} borderRadius="lg" boxShadow="sm">
            <Heading size="md" mb={4}>% de Gordura Aproximado</Heading>
            <Box mb={3} display="flex" alignItems="center">
              <Select size="sm" value={bodyFatMethod} onChange={(e) => setBodyFatMethod(e.target.value as any)} mr={2}>
                <option value="navy">Método da Marinha (Pescoço/Cintura)</option>
                <option value="7site">7 Dobras (Jackson-Pollock)</option>
              </Select>
              <Tooltip
                label={
                  bodyFatMethod === 'navy'
                    ? "O Método da Marinha dos EUA estima a gordura corporal usando medidas de circunferência (pescoço, cintura e altura). É um método prático que não exige equipamentos especiais."
                    : "O Protocolo de 7 Dobras de Jackson & Pollock usa um adipômetro para medir a espessura de dobras cutâneas em 7 locais do corpo. É geralmente mais preciso para pessoas ativas."
                }
                fontSize="md"
                p={3}
                rounded="md"
                hasArrow
              >
                <InfoOutlineIcon color="gray.400" cursor="help" />
              </Tooltip>
            </Box>
            <Box>
              <Text color="gray.500" fontSize="sm">
                {bodyFatMethod === 'navy' ? 'Estimativa (Método da Marinha)' : 'Jackson-Pollock 7 Dobras'}
              </Text>
              <Text fontSize="3xl" fontWeight="bold">
                {bodyFat ? `${bodyFat}%` : '--'}
              </Text>
              {!bodyFat && (
                <Text fontSize="xs" color="gray.400" mt={2}>
                  {bodyFatMethod === 'navy'
                    ? 'Requer: Altura, Pescoço e Cintura (e Quadril p/ mulheres).'
                    : 'Requer: Idade e as 7 dobras (Peitoral, Axila, Tríceps, Subescapular, Abdomem, Suprailíaca, Coxa).'}
                </Text>
              )}
            </Box>
          </Box>
        </SimpleGrid>



        <Box p={4} bg={cardBg} borderRadius="lg" boxShadow="sm">
          <Box mb={4}>
            <Select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              maxW="200px"
            >
              <option value="weight">Peso</option>
              {measurementTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </Select>
          </Box>
          <Line options={chartOptions} data={getChartData()} />
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Box
            p={6}
            shadow="base"
            borderColor="gray.200"
            rounded="lg"
            bg={cardBg}
          >
            <Heading size="md" mb={4}>
              Última Foto
            </Heading>
            {lastPhoto ? (
              <Image
                src={lastPhoto.url}
                alt={`Foto ${ANGLE_LABELS[lastPhoto.angle as keyof typeof ANGLE_LABELS]}`}
                borderRadius="lg"
                width="100%"
                height="300px"
                objectFit="contain"
                bg="black"
              />
            ) : (
              <Text color="gray.600">Nenhuma foto registrada</Text>
            )}
          </Box>

          <Box
            p={6}
            shadow="base"
            borderColor="gray.200"
            rounded="lg"
            bg={cardBg}
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