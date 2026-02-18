'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Grid,
  Image,
  Spinner,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  FormControl,
  FormLabel,
  HStack,
  Button,
} from '@chakra-ui/react';
import axios from 'axios';
import { useStudent } from '@/contexts/StudentContext';

interface Photo {
  id: string;
  url: string;
  angle: string;
  date: string;
}

const ANGLE_LABELS: Record<string, string> = {
  FRONT: 'Frente',
  BACK: 'Costa',
  LEFT: 'Lado esquerdo',
  RIGHT: 'Lado direito',
  BICEPS_FRONT: 'Duplo bíceps frente',
  BICEPS_BACK: 'Duplo bíceps costa',
};

const ANGLES = Object.entries(ANGLE_LABELS).map(([value, label]) => ({ value, label }));

export default function MonthlyComparePage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const { selectedStudentId } = useStudent();

  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const headerText = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    const fetchPhotos = async () => {
      setLoading(true);
      try {
        const studentId = selectedStudentId || (typeof window !== 'undefined' ? sessionStorage.getItem('selectedStudentId') : null);
        const url = studentId ? `/api/photos?studentId=${studentId}` : '/api/photos';
        const response = await axios.get(url, { withCredentials: true });
        setPhotos(response.data);
      } catch (error) {
        console.error('Erro ao buscar fotos:', error);
        setPhotos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [selectedStudentId]);

  // Define o ano padrão quando as fotos são carregadas
  useEffect(() => {
    if (photos.length > 0 && !selectedYear) {
      const firstDate = new Date(photos[0].date);
      setSelectedYear(firstDate.getFullYear().toString());
    }
  }, [photos, selectedYear]);

  // Agrupa fotos por mês/ano e ângulo
  const photosByMonthAndAngle: Record<string, Record<string, Photo>> = {};
  photos.forEach(photo => {
    const date = new Date(photo.date);
    const monthYear = `${date.toLocaleString('pt-BR', { month: 'long' })}-${date.getFullYear()}`;
    const monthYearKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!photosByMonthAndAngle[monthYearKey]) {
      photosByMonthAndAngle[monthYearKey] = {};
    }
    photosByMonthAndAngle[monthYearKey][photo.angle] = photo;
  });

  // Obtém todos os meses/anos disponíveis
  const allMonthYears = Object.keys(photosByMonthAndAngle).sort((a, b) => {
    const [ya, ma] = a.split('-').map(Number);
    const [yb, mb] = b.split('-').map(Number);
    return new Date(ya, ma - 1).getTime() - new Date(yb, mb - 1).getTime();
  });

  // Filtra por ano se selecionado
  const filteredMonthYears = selectedYear
    ? allMonthYears.filter(key => key.startsWith(selectedYear))
    : allMonthYears;

  // Obtém todos os anos disponíveis
  const availableYears = Array.from(
    new Set(
      allMonthYears.map(key => key.split('-')[0])
    )
  ).sort((a, b) => parseInt(b) - parseInt(a));

  // Formata o nome do mês
  const formatMonthYear = (key: string) => {
    const [year, month] = key.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={10}>
        <Spinner size="xl" />
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={6}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" color={textColor}>Comparação Mensal de Fotos</Heading>
          <Text mt={1} color={headerText}>Visualize a evolução mês a mês</Text>
        </Box>

        <HStack>
          <FormControl maxW="200px">
            <FormLabel>Filtrar por Ano</FormLabel>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              placeholder="Todos os anos"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </Select>
          </FormControl>
          {selectedYear && (
            <Button onClick={() => setSelectedYear('')} size="sm" variant="ghost">
              Limpar filtro
            </Button>
          )}
        </HStack>

        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>Comparação por Ângulo (Mês a Mês)</Tab>
            <Tab>Visualização por Mês (Todos os Ângulos)</Tab>
          </TabList>

          <TabPanels>
            {/* Tab 1: Comparação mês a mês por ângulo */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                {ANGLES.map(({ value, label }) => (
                  <Box key={value} bg={bgColor} borderRadius="lg" p={4} borderWidth={1} borderColor={borderColor}>
                    <Heading size="md" mb={4} color={textColor}>{label}</Heading>
                    <Box overflowX="auto">
                      <Grid
                        templateColumns={`repeat(${filteredMonthYears.length}, minmax(200px, 1fr))`}
                        gap={4}
                        minW={`${filteredMonthYears.length * 220}px`}
                      >
                        {filteredMonthYears.map(monthYearKey => {
                          const photo = photosByMonthAndAngle[monthYearKey]?.[value];
                          return (
                            <Box
                              key={monthYearKey}
                              textAlign="center"
                              p={2}
                              borderWidth={1}
                              borderColor={borderColor}
                              borderRadius="md"
                              bg={headerBg}
                            >
                              <Text fontWeight="bold" mb={2} fontSize="sm" color={textColor}>
                                {formatMonthYear(monthYearKey)}
                              </Text>
                              {photo ? (
                                <Image
                                  src={photo.url}
                                  alt={`${label} - ${formatMonthYear(monthYearKey)}`}
                                  borderRadius="md"
                                  maxH="300px"
                                  width="auto"
                                  mx="auto"
                                  objectFit="contain"
                                  cursor="pointer"
                                  onClick={() => window.open(photo.url, '_blank')}
                                />
                              ) : (
                                <Box
                                  height="300px"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  bg={bgColor}
                                  borderRadius="md"
                                >
                                  <Text color={headerText} fontSize="sm">Sem foto</Text>
                                </Box>
                              )}
                            </Box>
                          );
                        })}
                      </Grid>
                    </Box>
                  </Box>
                ))}
              </VStack>
            </TabPanel>

            {/* Tab 2: Visualização por mês (todos os ângulos) */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                {filteredMonthYears.map(monthYearKey => (
                  <Box key={monthYearKey} bg={bgColor} borderRadius="lg" p={4} borderWidth={1} borderColor={borderColor}>
                    <Heading size="md" mb={4} color={textColor}>
                      {formatMonthYear(monthYearKey)}
                    </Heading>
                    <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                      {ANGLES.map(({ value, label }) => {
                        const photo = photosByMonthAndAngle[monthYearKey]?.[value];
                        return (
                          <Box
                            key={value}
                            textAlign="center"
                            p={2}
                            borderWidth={1}
                            borderColor={borderColor}
                            borderRadius="md"
                            bg={headerBg}
                          >
                            <Text fontWeight="bold" mb={2} fontSize="sm" color={textColor}>
                              {label}
                            </Text>
                            {photo ? (
                              <Image
                                src={photo.url}
                                alt={`${label} - ${formatMonthYear(monthYearKey)}`}
                                borderRadius="md"
                                maxH="250px"
                                width="auto"
                                mx="auto"
                                objectFit="contain"
                                cursor="pointer"
                                onClick={() => window.open(photo.url, '_blank')}
                              />
                            ) : (
                              <Box
                                height="250px"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                bg={bgColor}
                                borderRadius="md"
                              >
                                <Text color={headerText} fontSize="sm">Sem foto</Text>
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </Grid>
                  </Box>
                ))}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
}

