"use client";
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box, Container, Heading, Text, VStack, Grid, Image, Spinner, IconButton, Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton, useDisclosure, Flex, Tooltip, Button, useColorModeValue, FormControl, FormLabel, Select, useColorMode
} from '@chakra-ui/react';
import { SearchIcon, ViewIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import useSWR from 'swr';

interface Photo {
  id: string;
  url: string;
  angle: string;
  date: string;
}

const ANGLE_LABELS = {
  FRONT: 'Frente',
  BACK: 'Costa',
  LEFT: 'Lado esquerdo',
  RIGHT: 'Lado direito',
  BICEPS_FRONT: 'Duplo bíceps frente',
  BICEPS_BACK: 'Duplo bíceps costa',
};
const ANGLES = Object.entries(ANGLE_LABELS).map(([value, label]) => ({ value, label }));

export default function ComparePhotosPage() {
  const searchParams = useSearchParams();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomPhoto, setZoomPhoto] = useState<Photo | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const dates = searchParams.get('dates')?.split(',') || [];
  const gridRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const exportGridRef = useRef<HTMLDivElement>(null);
  const { colorMode, toggleColorMode } = useColorMode();

  // Add color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const headerText = useColorModeValue('gray.600', 'gray.300');

  const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json());
  const { data: measurements = [] } = useSWR('/api/measurements', fetcher, { revalidateOnFocus: false });

  // Função para exibir data formatada
  const formatDateDisplay = (dateIso: string) => {
    const date = new Date(dateIso);
    return date.toLocaleDateString('pt-BR');
  };

  function getPesoByDate(dateIso: string) {
    const medida = measurements.find((m: any) => {
      const d = new Date(m.date);
      const localDateIso = d.toISOString().split('T')[0];
      return localDateIso === dateIso;
    });
    return medida ? `${medida.weight}kg` : null;
  }

  useEffect(() => {
    const fetchPhotos = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/photos');
        const data = await response.json();
        setPhotos(data);
      } catch (error) {
        setPhotos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPhotos();
  }, []);

  // Agrupa as fotos por data ISO e tipo
  const photosByDateAndAngle: Record<string, Record<string, Photo>> = {};
  photos.forEach(photo => {
    const dateIso = photo.date.split('T')[0];
    if (!photosByDateAndAngle[dateIso]) photosByDateAndAngle[dateIso] = {};
    photosByDateAndAngle[dateIso][photo.angle] = photo;
  });

  // Ordena as datas selecionadas do menor para o maior (datas ISO)
  const sortedDates = dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  // Fullscreen handlers
  const handleFullscreen = () => {
    if (gridRef.current) {
      if (!document.fullscreenElement) {
        gridRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Navegação por teclado no modal de zoom
  useEffect(() => {
    if (!isOpen || !zoomPhoto) return;
    const flatPhotos: Photo[] = [];
    sortedDates.forEach(date => {
      ANGLES.forEach(({ value }) => {
        const photo = photosByDateAndAngle[date]?.[value];
        if (photo) flatPhotos.push(photo);
      });
    });
    const currentIdx = flatPhotos.findIndex(p => p.id === zoomPhoto.id);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIdx > 0) setZoomPhoto(flatPhotos[currentIdx - 1]);
      if (e.key === 'ArrowRight' && currentIdx < flatPhotos.length - 1) setZoomPhoto(flatPhotos[currentIdx + 1]);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, zoomPhoto, photos, sortedDates, ANGLES, onClose]);

  // Função para exportar para PDF via print
  const handleExportPDF = async () => {
    // Gera HTML do grid
    const gridHtml = `
      <html>
      <head>
        <title>Comparação de Fotos</title>
        <style>
          @page { size: A0 landscape; margin: 0; }
          @media print {
            html, body { width: auto !important; height: auto !important; min-width: 0 !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; }
            .pdf-grid-container { width: max-content !important; height: max-content !important; page-break-inside: avoid !important; }
            .pdf-grid { page-break-inside: avoid !important; }
          }
          body { background: #232837; color: #fff; font-family: sans-serif; margin: 0; padding: 0; }
          .pdf-grid-container { padding: 24px; }
          .pdf-header { font-size: 2rem; font-weight: bold; margin-bottom: 16px; }
          .pdf-grid { display: grid; grid-template-columns: 120px repeat(${sortedDates.length}, 220px); }
          .pdf-grid .pdf-header-cell { background: #2d3748; color: #fff; font-weight: bold; text-align: center; padding: 8px 0; border-bottom: 2px solid #444; }
          .pdf-grid .pdf-angle-cell { background: #2d3748; color: #fff; font-weight: bold; text-align: right; padding: 8px 8px 8px 0; border-right: 2px solid #444; }
          .pdf-grid .pdf-photo-cell { background: #232837; text-align: center; border-right: 1px solid #444; border-bottom: 1px solid #444; }
          .pdf-grid img { height: 350px; width: auto; max-width: 210px; border-radius: 8px; background: #232837; margin: 0 auto; display: block; }
          .pdf-grid .pdf-date { font-size: 1.1rem; font-weight: bold; }
          .pdf-grid .pdf-peso { font-size: 0.95rem; color: #cbd5e1; font-weight: normal; }
        </style>
      </head>
      <body>
        <div class="pdf-grid-container">
          <div class="pdf-header">Comparação de Fotos</div>
          <div class="pdf-grid">
            <div></div>
            ${sortedDates.map(date => `
              <div class="pdf-header-cell">
                <div class="pdf-date">${formatDateDisplay(date)}</div>
                ${getPesoByDate(date) ? `<div class="pdf-peso">${getPesoByDate(date)}</div>` : ''}
              </div>
            `).join('')}
            ${ANGLES.map(({ value, label }) => `
              <div class="pdf-angle-cell">${label}</div>
              ${sortedDates.map(date => {
                const photo = photosByDateAndAngle[date]?.[value];
                return `<div class="pdf-photo-cell">${photo ? `<img src='${photo.url}' alt='${label}' />` : '-'}</div>`;
              }).join('')}
            `).join('')}
          </div>
        </div>
      </body>
      </html>
    `;
    // Abre nova aba e imprime
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(gridHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 800);
    } else {
      alert('Não foi possível abrir a janela de impressão. Por favor, permita pop-ups para este site.');
    }
  };

  return (
    <Container maxW="container.xl" py={6}>
      <VStack spacing={4} align="stretch">
        <Box>
          <Heading size="lg" color={textColor}>Comparação de Fotos</Heading>
          <Text mt={1} color={headerText}>Visualize a evolução em diferentes ângulos</Text>
        </Box>
        <Flex align="center" justify="space-between" mb={2}>
          <Box>
            <Button
              colorScheme="blue"
              onClick={handleExportPDF}
              leftIcon={<SearchIcon />}
            >
              Exportar PDF
            </Button>
          </Box>
          <Box>
            <Tooltip label={isFullscreen ? 'Sair do modo tela cheia' : 'Tela cheia'}>
              <IconButton
                aria-label="Tela cheia"
                icon={<ViewIcon />}
                onClick={handleFullscreen}
                size="lg"
                variant="ghost"
              />
            </Tooltip>
          </Box>
        </Flex>
        {loading ? (
          <Spinner size="xl" />
        ) : (
          <Box ref={gridRef} w="100%" overflowX="auto" bg={bgColor} borderRadius="lg" p={0} m={0} borderWidth={1} borderColor={borderColor}>
            <Box position="sticky" top={0} zIndex={2} bg={headerBg} boxShadow="sm" borderBottomWidth={1} borderColor={borderColor}>
              <Grid
                templateColumns={{ base: `100px repeat(${sortedDates.length}, 140px)`, md: `120px repeat(${sortedDates.length}, 220px)` }}
                columnGap={0}
                rowGap={0}
                alignItems="center"
                w="100%"
                m={0}
                p={0}
                minW={{ base: `${sortedDates.length * 140 + 100}px`, md: `${sortedDates.length * 220 + 120}px` }}
              >
                <Box p={0} m={0}></Box>
                {sortedDates.map(date => (
                  <Box key={date} textAlign="center" fontWeight="bold" p={{ base: 1, md: 2 }} m={0} color={textColor} borderRightWidth={1} borderColor={borderColor} minH={{ base: '40px', md: '56px' }} display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                    <Text fontSize={{ base: 'sm', md: 'md' }}>{formatDateDisplay(date)}</Text>
                    {getPesoByDate(date) && (
                      <Text fontSize={{ base: 'xs', md: 'sm' }} color={headerText} fontWeight="normal">{getPesoByDate(date)}</Text>
                    )}
                  </Box>
                ))}
              </Grid>
            </Box>
            <Grid
              templateColumns={{ base: `100px repeat(${sortedDates.length}, 140px)`, md: `120px repeat(${sortedDates.length}, 220px)` }}
              columnGap={0}
              rowGap={{ base: '6px', md: '12px' }}
              alignItems="start"
              justifyItems="start"
              w="100%"
              m={0}
              p={0}
              minW={{ base: `${sortedDates.length * 140 + 100}px`, md: `${sortedDates.length * 220 + 120}px` }}
            >
              {ANGLES.map(({ value, label }) => [
                <Box key={label} fontWeight="bold" textAlign="right" pr={{ base: 1, md: 2 }} py={{ base: 1, md: 2 }} p={0} m={0} color={headerText} bg={headerBg} borderRightWidth={1} borderColor={borderColor} minH={{ base: '40px', md: '56px' }} display="flex" alignItems="center" justifyContent="flex-end" position="sticky" left={0} zIndex={1} fontSize={{ base: 'xs', md: 'sm' }}>
                  <Text>{label}</Text>
                </Box>,
                ...sortedDates.map(date => {
                  const photo = photosByDateAndAngle[date]?.[value];
                  return (
                    <Box key={date + value} p={0} m={0} textAlign="center" position="relative" height={{ base: '170px', md: '370px' }} width="100%" display="flex" alignItems="center" justifyContent="center" bg={bgColor} borderRightWidth={1} borderColor={borderColor}>
                      {photo ? (
                        <Image
                          src={photo.url}
                          alt={label}
                          borderRadius="md"
                          height={{ base: '150px', md: '350px' }}
                          width="auto"
                          maxWidth="100%"
                          objectFit="contain"
                          bg={bgColor}
                          boxShadow="none"
                          style={{ margin: 0, padding: 0, display: 'block', height: '100%', width: 'auto', maxWidth: '100%', border: 'none', boxShadow: 'none' }}
                        />
                      ) : (
                        <Text color={headerText} fontSize={{ base: 'xs', md: 'sm' }}>-</Text>
                      )}
                    </Box>
                  );
                })
              ])}
            </Grid>
          </Box>
        )}
        {/* Modal de zoom */}
        <Modal isOpen={isOpen} onClose={onClose} size="6xl" isCentered>
          <ModalOverlay />
          <ModalContent bg="black" maxW="90vw" maxH="90vh">
            <ModalCloseButton color="white" zIndex={2} />
            <ModalBody display="flex" alignItems="center" justifyContent="center" p={0}>
              {zoomPhoto && (
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
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
        {/* Grid offscreen para exportação PDF */}
        <Box ref={exportGridRef} style={{ position: 'fixed', top: 0, left: 0, width: '1px', height: '1px', overflow: 'hidden', zIndex: -1, background: '#232837', display: 'block' }}>
          <Box bg={headerBg} borderRadius="lg" p={0} m={0} borderWidth={1} borderColor={borderColor}>
            <Box bg={headerBg} boxShadow="sm" borderBottomWidth={1} borderColor={borderColor}>
              <Grid templateColumns={`120px repeat(${sortedDates.length}, 220px)`} columnGap={0} rowGap={0} alignItems="center" w="100%" m={0} p={0}>
                <Box p={0} m={0}></Box>
                {sortedDates.map(date => (
                  <Box key={date} textAlign="center" fontWeight="bold" p={2} m={0} color={textColor} borderRightWidth={1} borderColor={borderColor} minH="56px" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                    <Text fontSize="md">{formatDateDisplay(date)}</Text>
                    {getPesoByDate(date) && (
                      <Text fontSize="sm" color={headerText} fontWeight="normal">{getPesoByDate(date)}</Text>
                    )}
                  </Box>
                ))}
              </Grid>
            </Box>
            <Grid templateColumns={`120px repeat(${sortedDates.length}, 220px)`} columnGap={0} rowGap={"12px"} alignItems="start" justifyItems="start" w="100%" m={0} p={0}>
              {ANGLES.map(({ value, label }) => [
                <Box key={label} fontWeight="bold" textAlign="right" pr={2} py={2} p={0} m={0} color={headerText} bg={headerBg} borderRightWidth={1} borderColor={borderColor} minH="56px" display="flex" alignItems="center" justifyContent="flex-end">
                  <Text fontSize="sm">{label}</Text>
                </Box>,
                ...sortedDates.map(date => {
                  const photo = photosByDateAndAngle[date]?.[value];
                  return (
                    <Box key={date + value} p={0} m={0} textAlign="center" position="relative" height="370px" width="100%" display="flex" alignItems="center" justifyContent="center" bg={bgColor} borderRightWidth={1} borderColor={borderColor}>
                      {photo ? (
                        <Image
                          src={photo.url}
                          alt={label}
                          borderRadius="md"
                          height="350px"
                          width="auto"
                          maxWidth="100%"
                          objectFit="contain"
                          bg={bgColor}
                          boxShadow="none"
                          style={{ margin: 0, padding: 0, display: 'block', height: '350px', width: 'auto', maxWidth: '100%', border: 'none', boxShadow: 'none' }}
                        />
                      ) : (
                        <Text color={headerText}>-</Text>
                      )}
                    </Box>
                  );
                })
              ])}
            </Grid>
          </Box>
        </Box>
      </VStack>
    </Container>
  );
} 