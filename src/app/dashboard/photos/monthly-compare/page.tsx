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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import axios from 'axios';
import { useStudent } from '@/contexts/StudentContext';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

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

  // Controle de Modal de Zoom
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [zoomPhoto, setZoomPhoto] = useState<Photo | null>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const headerText = useColorModeValue('gray.600', 'gray.300');

  // Determinar o ID do aluno para buscar medidas
  const studentIdForMeasurements = selectedStudentId || (typeof window !== 'undefined' ? sessionStorage.getItem('selectedStudentId') : null);
  const measurementsUrl = studentIdForMeasurements ? `/api/measurements?studentId=${studentIdForMeasurements}` : '/api/measurements';

  const fetcher = (url: string) => axios.get(url, { withCredentials: true }).then(res => res.data);
  // Use SWR for caching and easy access, consistent with other pages
  // Note: We need to import useSWR. If not available, we can fetch in useEffect.
  // Assuming useSWR is available or we add it. If not, I'll add the fetch to the existing useEffect.
  // Let's use basic fetch in useEffect to match the file style if useSWR isn't imported, 
  // but adding useSWR is better. I'll stick to a simple state for now to minimize imports change if I can't see imports.
  // Actually, I can just fetch it.

  const [measurements, setMeasurements] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const studentId = selectedStudentId || (typeof window !== 'undefined' ? sessionStorage.getItem('selectedStudentId') : null);

        const photosUrl = studentId ? `/api/photos?studentId=${studentId}` : '/api/photos';
        const measurementsUrl = studentId ? `/api/measurements?studentId=${studentId}` : '/api/measurements';

        const [photosRes, measurementsRes] = await Promise.all([
          axios.get(photosUrl, { withCredentials: true }),
          axios.get(measurementsUrl, { withCredentials: true })
        ]);

        setPhotos(photosRes.data.sort((a: Photo, b: Photo) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        setMeasurements(measurementsRes.data);

      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setPhotos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedStudentId]);

  function getPesoByDate(dateStr: string) {
    // dateStr vindo do banco (ISO) ou objeto Date da foto
    const date = new Date(dateStr);

    // Formatar para comparação
    // Check UTC
    const dayUTC = String(date.getUTCDate()).padStart(2, '0');
    const monthUTC = String(date.getUTCMonth() + 1).padStart(2, '0');
    const yearUTC = date.getUTCFullYear();
    const utcDate = `${dayUTC}/${monthUTC}/${yearUTC}`;

    // Check Local
    const localDate = date.toLocaleDateString('pt-BR');

    const medida = measurements.find((m: any) => {
      const d = new Date(m.date);
      // Check UTC
      const mDayUTC = String(d.getUTCDate()).padStart(2, '0');
      const mMonthUTC = String(d.getUTCMonth() + 1).padStart(2, '0');
      const mYearUTC = d.getUTCFullYear();
      const mUtcDate = `${mDayUTC}/${mMonthUTC}/${mYearUTC}`;

      // Check Local
      const mLocalDate = d.toLocaleDateString('pt-BR');

      return mUtcDate === utcDate || mLocalDate === localDate || mUtcDate === localDate || mLocalDate === utcDate;
    });
    return medida ? `${medida.weight}kg` : null;
  }


  // Define o ano padrão quando as fotos são carregadas
  useEffect(() => {
    if (photos.length > 0 && !selectedYear) {
      const firstDate = new Date(photos[photos.length - 1].date); // Try to select the latest year
      setSelectedYear(firstDate.getFullYear().toString());
    }
  }, [photos, selectedYear]);

  // Agrupa fotos por mês/ano e ângulo (agora suporta múltiplas fotos)
  const photosByMonthAndAngle: Record<string, Record<string, Photo[]>> = {};
  photos.forEach(photo => {
    // Usando substring da data ISO (yyyy-mm-dd...) para garantir o ano original em que a foto foi cadastrada
    // Evita shifts de UTC que empuram fotos do final do ano pro ano seguinte
    const monthYearKey = photo.date.substring(0, 7); // extrai "YYYY-MM"

    if (!photosByMonthAndAngle[monthYearKey]) {
      photosByMonthAndAngle[monthYearKey] = {};
    }
    if (!photosByMonthAndAngle[monthYearKey][photo.angle]) {
      photosByMonthAndAngle[monthYearKey][photo.angle] = [];
    }
    photosByMonthAndAngle[monthYearKey][photo.angle].push(photo);
  });

  // Obtém todos os meses/anos disponíveis (ex: "2024-02", "2024-10") e ordena decrescentemente (mais novo primeiro)
  const allMonthYears = Object.keys(photosByMonthAndAngle).sort((a, b) => b.localeCompare(a));

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
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
                        templateColumns={`repeat(${filteredMonthYears.length}, minmax(220px, 1fr))`}
                        gap={4}
                        minW={`${filteredMonthYears.length * 240}px`}
                      >
                        {filteredMonthYears.map(monthYearKey => {
                          const photos = photosByMonthAndAngle[monthYearKey]?.[value] || [];
                          return (
                            <Box
                              key={monthYearKey}
                              textAlign="center"
                              p={2}
                              borderWidth={1}
                              borderColor={borderColor}
                              borderRadius="md"
                              bg={headerBg}
                              verticalAlign="top"
                            >
                              <Text fontWeight="bold" mb={2} fontSize="sm" color={textColor}>
                                {formatMonthYear(monthYearKey)}
                              </Text>
                              {photos.length > 0 ? (
                                <VStack spacing={2}>
                                  {photos.map(photo => {
                                    const peso = getPesoByDate(photo.date);
                                    return (
                                      <Box key={photo.id} w="100%">
                                        <Text fontSize="xs" color="gray.500" mb={1}>
                                          {peso ? `${peso} - ` : ''}{formatDate(photo.date)}
                                        </Text>
                                        <Image
                                          src={photo.url}
                                          alt={`${label} - ${formatDate(photo.date)}`}
                                          borderRadius="md"
                                          maxH="200px"
                                          width="auto"
                                          mx="auto"
                                          objectFit="contain"
                                          cursor="zoom-in"
                                          onClick={() => {
                                            setZoomPhoto(photo);
                                            onOpen();
                                          }}
                                        />
                                      </Box>
                                    );
                                  })}
                                </VStack>
                              ) : (
                                <Box
                                  height="200px"
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
                        const photos = photosByMonthAndAngle[monthYearKey]?.[value] || [];
                        return (
                          <Box
                            key={value}
                            textAlign="center"
                            p={2}
                            borderWidth={1}
                            borderColor={borderColor}
                            borderRadius="md"
                            bg={headerBg}
                            verticalAlign="top"
                          >
                            <Text fontWeight="bold" mb={2} fontSize="sm" color={textColor}>
                              {label}
                            </Text>
                            {photos.length > 0 ? (
                              <VStack spacing={2}>
                                {photos.map(photo => {
                                  const peso = getPesoByDate(photo.date);
                                  return (
                                    <Box key={photo.id} w="100%">
                                      <Text fontSize="xs" color="gray.500" mb={1}>
                                        {peso ? `${peso} - ` : ''}{formatDate(photo.date)}
                                      </Text>
                                      <Image
                                        src={photo.url}
                                        alt={`${label} - ${formatDate(photo.date)}`}
                                        borderRadius="md"
                                        maxH="200px"
                                        width="auto"
                                        mx="auto"
                                        objectFit="contain"
                                        cursor="zoom-in"
                                        onClick={() => {
                                          setZoomPhoto(photo);
                                          onOpen();
                                        }}
                                      />
                                    </Box>
                                  );
                                })}
                              </VStack>
                            ) : (
                              <Box
                                height="200px"
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

        {/* Modal de Zoom */}
        <Modal isOpen={isOpen} onClose={onClose} size="6xl" isCentered>
          <ModalOverlay />
          <ModalContent bg="black" maxW="90vw" maxH="90vh">
            <ModalCloseButton color="white" zIndex={2} />
            <ModalBody display="flex" alignItems="center" justifyContent="center" p={0} overflow="hidden">
              {zoomPhoto && (
                <TransformWrapper
                  initialScale={1}
                  minScale={0.5}
                  maxScale={8}
                  centerOnInit={true}
                >
                  <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%" }}>
                    <Image
                      src={zoomPhoto.url}
                      alt={zoomPhoto.angle}
                      maxW="90vw"
                      maxH="80vh"
                      objectFit="contain"
                      mx="auto"
                      borderRadius="md"
                      boxShadow="lg"
                      bg="black"
                    />
                  </TransformComponent>
                </TransformWrapper>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>

      </VStack>
    </Container>
  );
}

