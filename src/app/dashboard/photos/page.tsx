'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Grid,
  GridItem,
  useToast,
  Image,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  FormControl,
  FormLabel,
  Flex,
  Checkbox,
  ModalFooter,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Divider,
  useColorModeValue,
  useColorMode,
  useTheme,
  Badge,
} from '@chakra-ui/react';
import { useStudent } from '@/contexts/StudentContext';
import { AddIcon, DeleteIcon, EditIcon, AttachmentIcon, CalendarIcon, SearchIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Link from 'next/link';
import Cropper from 'react-easy-crop';
import { useRef } from 'react';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import useSWR from 'swr';
import Select from 'react-select';
import { GroupBase } from 'react-select';

interface Photo {
  id: string;
  url: string;
  angle: string;
  date: string;
}

const ANGLE_LABELS: Record<string, string> = {
  FRONT: 'Frente',
  LEFT: 'Lado esquerdo',
  RIGHT: 'Lado direito',
  BACK: 'Costa',
  BICEPS_FRONT: 'Duplo bíceps frente',
  BICEPS_BACK: 'Duplo bíceps costa',
};

const ANGLES = Object.entries(ANGLE_LABELS).map(([value, label]) => ({ value, label }));

function PhotoCell({ photo, angle, date, onUpload, onEdit, onDelete, openCropper }: {
  photo: Photo | null;
  angle: string;
  date: string;
  onUpload: (file: File, angle: string) => void;
  onEdit: (photo: Photo) => void;
  onDelete: (id: string) => void;
  openCropper: (file: File | null, angle?: string, date?: string) => void;
}) {
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    maxFiles: 1,
    noClick: true, // We will handle click manually on the button to avoid double triggers
    noKeyboard: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) openCropper(acceptedFiles[0], angle, date);
    },
  });

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleNativeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.target.files && e.target.files.length > 0) {
      openCropper(e.target.files[0], angle, date);
    }
    // Clean input to allow re-selection of the same file
    e.target.value = '';
  };

  const [hovered, setHovered] = useState(false);

  return (
    <Box
      p={1}
      textAlign="center"
      position="relative"
      tabIndex={0}
      {...getRootProps()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        '.photo-zoomable': {
          transition: 'transform 0.25s cubic-bezier(.4,0,.2,1)',
        },
        '&:hover .photo-zoomable': {
          transform: 'scale(1.7)',
          zIndex: 10,
        },
      }}
    >
      <input {...getInputProps()} />
      {/* Inputs nativos escondidos fora do gerenciamento do React Dropzone para resolver bloqueios do Safari iOS */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        style={{ display: 'none' }}
        onChange={handleNativeInput}
      />
      <input
        type="file"
        accept="image/*"
        ref={galleryInputRef}
        style={{ display: 'none' }}
        onChange={handleNativeInput}
      />

      {photo ? (
        <Box position="relative">
          <Image
            src={photo.url}
            alt={angle}
            borderRadius="md"
            width="80px"
            height="80px"
            objectFit="contain"
            mx="auto"
            className="photo-zoomable"
          />
          <VStack
            position="absolute"
            left="50%"
            bottom={1}
            transform="translateX(-50%)"
            spacing={1}
            align="center"
            w="90%"
            opacity={{ base: 1, md: hovered ? 1 : 0 }} // No mobile, sempre mostra ou melhora a interação
            transition="opacity 0.2s"
            zIndex={2}
            bg="rgba(20,20,20,0.6)"
            borderRadius="md"
            px={1}
            py={1}
          >
            <Flex gap={1} flexWrap="wrap" justify="center">
              {/* Câmera Tirar Foto - Mobile only */}
              <IconButton
                aria-label="Tirar Foto com a Câmera"
                icon={<AddIcon />}
                size="xs"
                colorScheme="teal"
                display={{ base: 'flex', md: 'none' }}
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
              />
              {/* Escolher da Galeria / Desktop Explorador */}
              <IconButton
                aria-label="Explorador / Galeria"
                icon={<AttachmentIcon transform="rotate(270deg)" />} // Generic File Icon Substitute
                size="xs"
                colorScheme="blue"
                onClick={(e) => {
                  e.stopPropagation();
                  galleryInputRef.current?.click();
                }}
              />
              {/* Botão de Colar Foto (Clipboard) - Útil no Desktop, inútil no Mobile */}
              <IconButton
                aria-label="Colar foto da área de transferência"
                icon={<AttachmentIcon />}
                size="xs"
                colorScheme="green"
                display={{ base: 'none', md: 'flex' }}
                onClick={(e) => {
                  e.stopPropagation();
                  openCropper(null, angle, date);
                }}
              />
              <IconButton
                aria-label="Editar/Cortar foto"
                icon={<EditIcon />}
                size="xs"
                colorScheme="blue"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(photo);
                }}
              />
              <IconButton
                aria-label="Excluir foto"
                icon={<DeleteIcon />}
                size="xs"
                colorScheme="red"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(photo.id);
                }}
              />
            </Flex>
          </VStack>
        </Box>
      ) : (
        <Box position="relative" minH="80px" display="flex" flexDirection="column" gap={2} alignItems="center" justifyContent="center">
          <Flex gap={2}>
            {/* Tirar Foto Câmera (Mobile) */}
            <IconButton
              aria-label="Tirar Foto"
              icon={<AddIcon />}
              size="md"
              colorScheme="teal"
              borderRadius="full"
              display={{ base: 'flex', md: 'none' }}
              onClick={(e) => {
                e.stopPropagation();
                cameraInputRef.current?.click();
              }}
            />
            {/* Escolher Explorador/Galeria */}
            <IconButton
              aria-label="Galeria ou Explorador de Arquivos"
              icon={<AttachmentIcon transform="rotate(270deg)" />}
              size="md"
              colorScheme="blue"
              borderRadius="full"
              onClick={(e) => {
                e.stopPropagation();
                galleryInputRef.current?.click();
              }}
            />
            {/* Colar Imagem (Clipboard) - Apenas Desktop */}
            <IconButton
              aria-label="Colar da Área de Transferência"
              icon={<AttachmentIcon />}
              size="md"
              colorScheme="green"
              borderRadius="full"
              display={{ base: 'none', md: 'flex' }}
              onClick={(e) => {
                e.stopPropagation();
                openCropper(null, angle, date);
              }}
            />
          </Flex>
          <Text fontSize="xs" color="gray.400" display={{ base: 'none', md: 'block' }}>
            Upload ou Colar
          </Text>
        </Box>
      )}
    </Box>
  );
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Usar UTC para garantir a data correta independentemente do fuso horário
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

export default function PhotosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [selectedDate, setSelectedDate] = useState('');
  const [uploadingAngle, setUploadingAngle] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { selectedStudentId } = useStudent();
  const fetcher = (url: string) => axios.get(url, { withCredentials: true }).then(res => res.data);
  const photosUrl = selectedStudentId ? `/api/photos?studentId=${selectedStudentId}` : '/api/photos';
  const { data: photos = [], error, isLoading, mutate } = useSWR(photosUrl, fetcher, { revalidateOnFocus: false });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({ unit: '%', width: 100, height: 100, x: 0, y: 0 });
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const cropperRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedAngle, setSelectedAngle] = useState<string>('FRONT');
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteAngle, setPasteAngle] = useState<string | null>(null);
  const [pasteDate, setPasteDate] = useState<string | null>(null);
  const pasteInputRef = useRef<HTMLInputElement | null>(null);
  const [extraDates, setExtraDates] = useState<string[]>([]);
  const [deleteDate, setDeleteDate] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const [editColumnDateModal, setEditColumnDateModal] = useState<{ oldDate: string | null, newDate: string }>({ oldDate: null, newDate: '' });
  const { colorMode } = useColorMode();
  const headerBg = useColorModeValue('white', 'gray.800');
  const theme = useTheme();
  const measurementsUrl = selectedStudentId ? `/api/measurements?studentId=${selectedStudentId}` : '/api/measurements';
  const { data: measurements = [] } = useSWR(measurementsUrl, fetcher, { revalidateOnFocus: false });

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    maxFiles: 1,
    noClick: true,
    noKeyboard: true,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0 && uploadingAngle) {
        openCropper(acceptedFiles[0]);
      }
    },
  });

  const mainInputProps = getInputProps();
  if (mainInputProps.capture) {
    delete mainInputProps.capture;
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Agrupa as fotos por data e tipo
  const photosByDateAndAngle = useMemo(() => {
    const map: Record<string, Record<string, Photo>> = {};
    if (!photos || !Array.isArray(photos)) return map;

    console.log('Processando fotos:', photos.length);

    photos.forEach((photo: Photo) => {
      const date = formatDate(photo.date);
      if (!map[date]) {
        map[date] = {};
      }
      map[date][photo.angle] = photo;
    });
    console.log('Mapa de fotos:', map);
    return map;
  }, [photos]);
  // Ordena as datas do maior para o menor (mais recentes primeiro), incluindo extras
  const allDates = Array.from(new Set([...Object.keys(photosByDateAndAngle), ...extraDates]));
  const sortedDates = allDates.sort((a, b) => {
    const [da, ma, ya] = a.split('/').map(Number);
    const [db, mb, yb] = b.split('/').map(Number);
    // Usando Date.UTC para evitar shifts indesejados de fuso horário local transicionando anos
    return Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da);
  });

  // Gerar lista de meses/anos únicos presentes nas datas
  const allMonthYears = Array.from(new Set(sortedDates.map(date => {
    const [day, month, year] = date.split('/');
    // String template pura para ser a chave no filtro
    return `${month}/${year}`;
  })));
  // Estado do filtro de mês/ano
  const [selectedMonthYears, setSelectedMonthYears] = useState<string[]>(allMonthYears);
  const monthYearOptions: { value: string; label: string }[] = allMonthYears.map(my => ({ value: my, label: my }));
  const selectedMonthYearOptions: { value: string; label: string }[] = monthYearOptions.filter(opt => selectedMonthYears.includes(opt.value));
  // Atualizar filtro quando as datas mudarem
  useEffect(() => {
    setSelectedMonthYears(allMonthYears);
  }, [allMonthYears.join(',')]);
  // Filtrar datas exibidas
  const filteredDates = sortedDates.filter(date => {
    const [day, month, year] = date.split('/');
    return selectedMonthYears.includes(`${month}/${year}`);
  });

  // Seleção de datas
  const handleDateCheck = (date: string) => {
    setSelectedDates(prev =>
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
    );
  };
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedDates([]);
      setSelectAll(false);
    } else {
      setSelectedDates(sortedDates);
      setSelectAll(true);
    }
  };

  // Navegação para página de comparação
  const compareUrl = `/dashboard/photos/compare?dates=${selectedDates.join(',')}${selectedStudentId ? `&studentId=${selectedStudentId}` : ''}`;

  // Função para abrir o cropper com uma imagem
  const openCropper = (file: File | null, angle?: string, date?: string) => {
    setAspect(undefined); // Sempre abrir como 'Livre'
    if (angle) setUploadingAngle(angle);
    if (date) {
      // Converter a data do formato dd/mm/yyyy para yyyy-mm-dd
      const [day, month, year] = date.split('/');
      const isoDate = `${year}-${month}-${day}`;
      setSelectedDate(isoDate);
    }
    if (!file) {
      setCropImage(null); // Reset crop image when opening for paste
      setCropModalOpen(true);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // Função para pegar imagem do clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      console.log('Paste event triggered');
      if (e.clipboardData) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            console.log('File from clipboard:', file);
            if (file) openCropper(file, pasteAngle || undefined, pasteDate || undefined);
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Função para gerar imagem cortada (corrigir ctx e rotação)
  const getCroppedImg = async (imageSrc: string, cropPixels: any) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = cropPixels.width;
    canvas.height = cropPixels.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Erro ao criar contexto do canvas');
    if (rotation !== 0) {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(
        image,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        -canvas.width / 2,
        -canvas.height / 2,
        canvas.width,
        canvas.height
      );
      ctx.restore();
    } else {
      ctx.drawImage(
        image,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        cropPixels.width,
        cropPixels.height
      );
    }
    return new Promise<File>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], 'cropped.jpg', { type: 'image/jpeg' }));
        }
      }, 'image/jpeg');
    });
  };

  function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new window.Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });
  }

  // Handler para salvar crop
  const handleCropSave = async () => {
    // Validações básicas
    if (!cropImage) {
      toast({ title: 'Erro', description: 'Nenhuma imagem para salvar', status: 'error' });
      return;
    }
    if (!uploadingAngle) {
      toast({ title: 'Erro', description: 'Ângulo não selecionado', status: 'error' });
      return;
    }
    if (!selectedDate) {
      toast({ title: 'Erro', description: 'Data não selecionada', status: 'error' });
      return;
    }

    try {
      let fileToUpload: File;

      if (!imageRef) throw new Error('Imagem não carregada no modal');

      const isCropped = completedCrop && completedCrop.width > 0 && completedCrop.height > 0;
      const scaleX = imageRef.naturalWidth / imageRef.width;
      const scaleY = imageRef.naturalHeight / imageRef.height;

      let sourceX = isCropped ? completedCrop.x * scaleX : 0;
      let sourceY = isCropped ? completedCrop.y * scaleY : 0;
      let sourceW = isCropped ? completedCrop.width * scaleX : imageRef.naturalWidth;
      let sourceH = isCropped ? completedCrop.height * scaleY : imageRef.naturalHeight;

      const MAX_DIMENSION = 1024; // Compressão de tamanho de foto para padronização
      let targetW = sourceW;
      let targetH = sourceH;

      if (Math.max(sourceW, sourceH) > MAX_DIMENSION) {
        if (sourceW > sourceH) {
          targetH = Math.round((sourceH * MAX_DIMENSION) / sourceW);
          targetW = MAX_DIMENSION;
        } else {
          targetW = Math.round((sourceW * MAX_DIMENSION) / sourceH);
          targetH = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Contexto 2D não suportado');

      ctx.drawImage(
        imageRef,
        sourceX, sourceY, sourceW, sourceH,
        0, 0, targetW, targetH
      );

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.85)
      );

      if (!blob) throw new Error('Falha ao extrair BLOB da imagem processada');
      fileToUpload = new File([blob], 'photo.jpg', { type: 'image/jpeg' });

      // Fecha modal e limpa estados
      setCropModalOpen(false);
      setCropImage(null);
      setCrop({ unit: '%', width: 100, height: 100, x: 0, y: 0 });
      setCompletedCrop(null);

      // Executa o upload (handleUpload já possui verificações adicionais)
      await handleUpload(fileToUpload, uploadingAngle);

    } catch (error) {
      console.error('Erro ao preparar imagem:', error);
      toast({ title: 'Erro', description: 'Falha ao preparar imagem para salvar', status: 'error' });
    }
  };

  // Função para deletar todas as fotos de uma data
  const handleDeleteDate = async (date: string) => {
    // Verifica se existe pelo menos uma foto para a data
    const hasPhoto = (photos as Photo[]).some((p: Photo) => {
      const d = formatDate(p.date);
      return d === date;
    });
    if (!hasPhoto) {
      // Data extra (sem fotos no backend)
      setExtraDates(prev => prev.filter(d => d !== date));
      setSelectedDates(prev => prev.filter(d => d !== date));
      toast({ title: 'Sucesso', description: 'Data removida', status: 'success', duration: 3000, isClosable: true });
      setDeleteDate(null);
      return;
    }
    try {
      await axios.delete(`/api/photos?date=${encodeURIComponent(date)}`);
      mutate();
      setSelectedDates(prev => prev.filter(d => d !== date));
      toast({ title: 'Sucesso', description: 'Fotos da data excluídas', status: 'success', duration: 3000, isClosable: true });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível excluir as fotos da data', status: 'error', duration: 3000, isClosable: true });
    }
    setDeleteDate(null);
  };

  // Função para editar uma foto
  const handleEditPhoto = (photo: Photo) => {
    setCropImage(photo.url);
    setCropModalOpen(true);
    setUploadingAngle(photo.angle);
    // Converter a data ISO para o formato yyyy-mm-dd
    const date = new Date(photo.date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  // Adicionar handler para abrir modal de edição de data
  const handleEditPhotoDate = (photo: Photo) => {
    const date = new Date(photo.date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    setEditColumnDateModal({ oldDate: date.toISOString().split('T')[0], newDate: `${year}-${month}-${day}` });
  };

  // Função para atualizar apenas a data da foto
  const handleSavePhotoDate = async () => {
    if (!editColumnDateModal.oldDate || !editColumnDateModal.newDate) return;
    try {
      // Buscar a imagem original
      const response = await fetch(editColumnDateModal.oldDate);
      const blob = await response.blob();
      const file = new File([blob], 'original.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('angle', editColumnDateModal.oldDate.split('-')[2]);
      // Corrigir fuso horário aqui:
      const [year, month, day] = editColumnDateModal.newDate.split('-').map(Number);
      const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      formData.append('date', dateObj.toISOString());
      formData.append('id', editColumnDateModal.oldDate.split('-')[2]);
      await axios.put('/api/photos', formData);
      toast({ title: 'Data da foto atualizada', status: 'success', duration: 3000, isClosable: true });
      setEditColumnDateModal({ oldDate: null, newDate: '' });
      mutate();
    } catch (error) {
      toast({ title: 'Erro ao atualizar data', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const handleUpload = async (file: File, angle: string) => {
    if (!file || !angle) {
      toast({
        title: 'Erro',
        description: 'Ângulo não selecionado',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Se não tiver data selecionada, usar a data da coluna
    const dateToUse = selectedDate;
    if (!dateToUse) {
      toast({
        title: 'Erro',
        description: 'Data não selecionada',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Garantir que a data está em formato válido e ajustar para UTC meio-dia para evitar problemas de fuso horário
    const [year, month, day] = dateToUse.split('-').map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    if (isNaN(dateObj.getTime())) {
      toast({
        title: 'Erro',
        description: 'Data inválida. Por favor, selecione uma data válida.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('angle', angle);
    formData.append('date', dateObj.toISOString());
    if (selectedStudentId) {
      formData.append('studentId', selectedStudentId);
    }

    try {
      // Se já existe foto para o ângulo/data, faz update, senão faz upload novo
      const existing = (photos as Photo[]).find((p: Photo) => {
        const photoDate = new Date(p.date);
        const uploadDate = dateObj;
        return photoDate.toDateString() === uploadDate.toDateString() && p.angle === angle;
      });

      if (existing) {
        // Update (PUT)
        formData.append('id', existing.id);
        await axios.put('/api/photos', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        });
        toast({
          title: 'Sucesso',
          description: 'Foto atualizada com sucesso',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Novo upload (POST)
        await axios.post('/api/photos', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        });
        toast({
          title: 'Sucesso',
          description: 'Foto enviada com sucesso',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      mutate();
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível fazer o upload da foto',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Função para deletar uma foto
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/photos?id=${id}`, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      mutate();
      toast({
        title: 'Sucesso',
        description: 'Foto excluída com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a foto',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Função para atualizar a data de todas as fotos de uma coluna
  const handleSaveColumnDate = async () => {
    if (!editColumnDateModal.oldDate || !editColumnDateModal.newDate) return;
    try {
      // Encontrar todas as fotos daquela data
      const fotosAntigas = (photos as Photo[]).filter(p => formatDate(p.date) === editColumnDateModal.oldDate);

      // Se não encontrar fotos, pode ser problema de formatação. Vamos tentar bater com o que temos.
      console.log(`Atualizando fotos de ${editColumnDateModal.oldDate} para ${editColumnDateModal.newDate}. Encontradas: ${fotosAntigas.length}`);

      for (const foto of fotosAntigas) {
        const formData = new FormData();
        // Não enviamos o arquivo, apenas os metadados para atualização
        formData.append('angle', foto.angle);
        // Corrigir fuso horário aqui:
        const [year, month, day] = editColumnDateModal.newDate.split('-').map(Number);
        const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
        formData.append('date', dateObj.toISOString());
        formData.append('id', foto.id);

        await axios.put('/api/photos', formData);
      }
      toast({ title: 'Data da coluna atualizada', status: 'success', duration: 3000, isClosable: true });
      setEditColumnDateModal({ oldDate: null, newDate: '' });
      mutate();
    } catch (error) {
      console.error('Erro ao atualizar data da coluna:', error);
      toast({ title: 'Erro ao atualizar data da coluna', status: 'error', duration: 3000, isClosable: true });
    }
  };

  // Custom styles for react-select
  const selectStyles = {
    control: (base: any) => ({
      ...base,
      minHeight: 38,
      borderRadius: 8,
      background: colorMode === 'dark' ? theme.colors.gray[800] : '#fff',
      color: colorMode === 'dark' ? theme.colors.gray[100] : theme.colors.gray[800],
      boxShadow: '0 1px 4px #0001',
      borderColor: colorMode === 'dark' ? theme.colors.gray[700] : base.borderColor,
    }),
    menu: (base: any) => ({
      ...base,
      zIndex: 9999,
      background: colorMode === 'dark' ? theme.colors.gray[800] : '#fff',
      color: colorMode === 'dark' ? theme.colors.gray[100] : theme.colors.gray[800],
    }),
    option: (base: any, state: any) => ({
      ...base,
      background: state.isSelected
        ? (colorMode === 'dark' ? theme.colors.teal[600] : theme.colors.teal[200])
        : state.isFocused
          ? (colorMode === 'dark' ? theme.colors.gray[700] : theme.colors.gray[100])
          : 'transparent',
      color: colorMode === 'dark' ? theme.colors.gray[100] : theme.colors.gray[800],
    }),
    multiValue: (base: any) => ({
      ...base,
      background: colorMode === 'dark' ? theme.colors.teal[700] : theme.colors.teal[100],
      color: colorMode === 'dark' ? theme.colors.gray[100] : theme.colors.gray[800],
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: colorMode === 'dark' ? theme.colors.gray[100] : theme.colors.gray[800],
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: colorMode === 'dark' ? theme.colors.gray[100] : theme.colors.gray[800],
      ':hover': {
        background: colorMode === 'dark' ? theme.colors.red[600] : theme.colors.red[100],
        color: colorMode === 'dark' ? theme.colors.white : theme.colors.red[800],
      },
    }),
    input: (base: any) => ({
      ...base,
      color: colorMode === 'dark' ? theme.colors.gray[100] : theme.colors.gray[800],
    }),
    placeholder: (base: any) => ({
      ...base,
      color: colorMode === 'dark' ? theme.colors.gray[400] : theme.colors.gray[500],
    }),
    singleValue: (base: any) => ({
      ...base,
      color: colorMode === 'dark' ? theme.colors.gray[100] : theme.colors.gray[800],
    }),
  };

  function getPesoByDate(date: string) {
    // date no formato dd/mm/yyyy
    const medida = measurements.find((m: any) => {
      const d = new Date(m.date);
      // Check UTC
      const dayUTC = String(d.getUTCDate()).padStart(2, '0');
      const monthUTC = String(d.getUTCMonth() + 1).padStart(2, '0');
      const yearUTC = d.getUTCFullYear();
      const utcDate = `${dayUTC}/${monthUTC}/${yearUTC}`;

      // Check Local (pt-BR) just in case the measurement was saved in a way that shifts the day in UTC
      const localDate = d.toLocaleDateString('pt-BR');

      return utcDate === date || localDate === date;
    });
    return medida ? `${medida.weight}kg` : null;
  }

  if (status === 'loading' || isLoading) {
    return (
      <Container maxW="container.xl" py={10}>
        <VStack spacing={4} align="stretch">
          {[...Array(3)].map((_, i) => (
            <Box key={i} bg="gray.100" h="40px" borderRadius="md" />
          ))}
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={6}>
      <VStack spacing={4} align="stretch">
        <Box>
          <Heading size={{ base: 'md', md: 'lg' }}>Fotos</Heading>
          <Text mt={1} color="gray.600" display={{ base: 'none', md: 'block' }} fontSize="sm">Acompanhe sua evolução visual</Text>
        </Box>
        <Flex direction={{ base: 'column', md: 'row' }} align={{ base: 'stretch', md: 'flex-end' }} gap={4}>
          <FormControl maxW={{ base: '100%', md: '200px' }} mb={0}>
            <FormLabel fontSize={{ base: 'sm', md: 'md' }}>Data</FormLabel>
            <Input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </FormControl>
          <Button
            colorScheme="teal"
            w={{ base: '100%', md: 'auto' }}
            onClick={() => {
              if (!selectedDate) return;
              const [year, month, day] = selectedDate.split('-');
              const formatted = `${day}/${month}/${year}`;
              if (!sortedDates.includes(formatted) && !extraDates.includes(formatted)) {
                setExtraDates(prev => [...prev, formatted]);
              }
              setSelectedDate('');
            }}
            isDisabled={!selectedDate}
          >
            Adicionar Data
          </Button>
        </Flex>
        {/* Filtro e botões de ação */}
        <Flex justify="space-between" align="center" mb={2} flexWrap="wrap" gap={4}>
          <Box maxW={{ base: '100%', md: '420px' }} w="100%">
            <FormControl>
              <FormLabel fontSize="sm" color="gray.400">Filtrar por mês/ano</FormLabel>
              <Box sx={{
                '.react-select__control': {
                  minHeight: '38px',
                  maxHeight: '38px',
                  overflowY: 'hidden',
                  flexWrap: 'nowrap',
                },
                '.react-select__value-container': {
                  flexWrap: 'nowrap',
                  overflowX: 'auto',
                  maxHeight: '38px',
                  alignItems: 'center',
                },
                '.react-select__multi-value': {
                  marginRight: '4px',
                },
                '.react-select__indicators': {
                  height: '38px',
                },
              }}>
                <Select
                  isMulti
                  options={monthYearOptions}
                  value={selectedMonthYearOptions}
                  onChange={opts => {
                    const values = Array.isArray(opts) ? opts.map(opt => opt.value) : [];
                    setSelectedMonthYears(values.length ? values : allMonthYears);
                  }}
                  placeholder="Selecione mês/ano..."
                  closeMenuOnSelect={false}
                  styles={selectStyles}
                  hideSelectedOptions={false}
                  menuPlacement="auto"
                  menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                  maxMenuHeight={200}
                  isClearable
                  classNamePrefix="react-select"
                />
              </Box>
            </FormControl>
          </Box>
          <Flex gap={2} flexWrap="wrap" w={{ base: '100%', md: 'auto' }} justify={{ base: 'center', md: 'flex-end' }}>
            <Button
              colorScheme="teal"
              variant="outline"
              onClick={() => {
                setSelectedDates(filteredDates);
                setSelectAll(true);
              }}
            >
              Selecionar Todos
            </Button>
            <Button
              colorScheme="teal"
              leftIcon={<SearchIcon />}
              onClick={() => {
                if (selectedDates.length < 2) {
                  toast({
                    title: 'Erro',
                    description: 'Selecione pelo menos duas datas para comparar',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                  });
                  return;
                }
                router.push(compareUrl);
              }}
              isDisabled={selectedDates.length < 2}
            >
              Comparar Selecionadas
            </Button>
            <Button
              colorScheme="blue"
              onClick={() => router.push('/dashboard/photos/monthly-compare')}
            >
              Comparação Mensal
            </Button>
          </Flex>
        </Flex>
        {/* Visualização de todas as datas/fotos */}
        <Box mt={10}>
          <Box overflowX="auto" py={{ base: 2, md: 4 }}>
            <Grid id="photo-comparison-grid"
              templateColumns={{ base: `100px repeat(${filteredDates.length}, 140px)`, md: `120px repeat(${filteredDates.length}, 1fr)` }}
              gap={2}
              minW={{ base: `${filteredDates.length * 140 + 100}px`, md: '900px' }}
              alignItems="center"
            >
              {/* Cabeçalho: célula vazia + datas */}
              <Box />
              {filteredDates.map(date => (
                <Box key={date} bg={headerBg} borderRadius="lg" boxShadow="md" borderWidth={1} px={1} py={{ base: 2, md: 1 }} display="flex" flexDirection={{ base: 'column', md: 'row' }} alignItems="center" justifyContent="center" gap={{ base: 2, md: 1 }} minH={{ base: 'auto', md: '40px' }}>
                  <Checkbox
                    isChecked={selectedDates.includes(date)}
                    onChange={() => handleDateCheck(date)}
                  >
                    <Text fontWeight="bold" fontSize={{ base: 'xs', md: 'sm' }} textAlign="center" whiteSpace="normal" lineHeight="1.2">
                      {getPesoByDate(date) && <>{getPesoByDate(date)}<br /></>}
                      {date}
                    </Text>
                  </Checkbox>
                  <Flex gap={1}>
                    <IconButton
                      aria-label="Editar data da coluna"
                      icon={<CalendarIcon />}
                      size="xs"
                      colorScheme="yellow"
                      onClick={() => {
                        const [day, month, year] = date.split('/');
                        setEditColumnDateModal({ oldDate: date, newDate: `${year}-${month}-${day}` });
                      }}
                    />
                    <IconButton
                      aria-label="Excluir data"
                      icon={<DeleteIcon />}
                      size="xs"
                      colorScheme="red"
                      onClick={() => setDeleteDate(date)}
                    />
                  </Flex>
                </Box>
              ))}
              {/* Linhas: cada ângulo é uma linha, primeira coluna é o label, depois as fotos */}
              {ANGLES.map(({ value, label }) => [
                <Box key={label} minW={{ base: '80px', md: '110px' }} pr={{ base: 1, md: 2 }} display="flex" alignItems="center" justifyContent="flex-end">
                  <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.400" textAlign="right">{label}</Text>
                </Box>,
                ...filteredDates.map(date => (
                  <Box key={date + value} display="flex" alignItems="center" justifyContent="center">
                    <PhotoCell
                      photo={photosByDateAndAngle[date]?.[value] ?? null}
                      angle={value}
                      date={date}
                      onUpload={handleUpload}
                      onEdit={handleEditPhoto}
                      onDelete={handleDelete}
                      openCropper={openCropper}
                    />
                  </Box>
                ))
              ])}
            </Grid>
          </Box>
        </Box>
        {/* Modal de confirmação para exclusão de data */}
        <AlertDialog
          isOpen={!!deleteDate}
          leastDestructiveRef={cancelRef}
          onClose={() => setDeleteDate(null)}
        >
          <AlertDialogOverlay />
          <AlertDialogContent>
            <AlertDialogHeader>Excluir Data Selecionada</AlertDialogHeader>
            <AlertDialogBody>
              Tem certeza que deseja excluir todas as fotos (ou a data) de <b>{deleteDate}</b>?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setDeleteDate(null)}>
                Cancelar
              </Button>
              <Button colorScheme="red" ml={3} onClick={() => deleteDate && handleDeleteDate(deleteDate)}>
                Excluir
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {/* Modal de crop sempre presente */}
        <Modal isOpen={cropModalOpen} onClose={() => setCropModalOpen(false)} size="xl" isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Recorte a imagem (opcional)</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {cropImage ? (
                <ReactCrop
                  crop={crop}
                  onChange={c => setCrop(c)}
                  onComplete={c => setCompletedCrop(c)}
                  aspect={undefined}
                  minWidth={10}
                  minHeight={10}
                  keepSelection={true}
                >
                  <img
                    src={cropImage}
                    alt="Crop preview"
                    crossOrigin="anonymous"
                    style={{ maxWidth: '100%', maxHeight: '400px' }}
                    onLoad={e => setImageRef(e.currentTarget)}
                  />
                </ReactCrop>
              ) : (
                <Box
                  p={4}
                  border="2px dashed"
                  borderColor="gray.200"
                  borderRadius="md"
                  textAlign="center"
                  minH="200px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="gray.500">
                    Pressione <b>Ctrl+V</b> para colar uma imagem do clipboard
                  </Text>
                </Box>
              )}
            </ModalBody>
            <ModalFooter>
              {cropImage && (
                <Button
                  colorScheme="blue"
                  mr={3}
                  onClick={handleCropSave}
                >
                  {completedCrop && completedCrop.width && completedCrop.height ? 'Aplicar Recorte' : 'Salvar Imagem'}
                </Button>
              )}
              <Button onClick={() => {
                setCropModalOpen(false);
                setCropImage(null);
                setCrop({ unit: '%', width: 100, height: 100, x: 0, y: 0 });
                setCompletedCrop(null);
              }}>
                Cancelar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {/* Modal para editar data da coluna */}
        <Modal isOpen={!!editColumnDateModal.oldDate} onClose={() => setEditColumnDateModal({ oldDate: null, newDate: '' })}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Editar Data da Coluna</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl>
                <FormLabel>Nova Data</FormLabel>
                <Input
                  type="date"
                  value={editColumnDateModal.newDate}
                  onChange={e => setEditColumnDateModal(modal => ({ ...modal, newDate: e.target.value }))}
                />
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={handleSaveColumnDate}>
                Salvar
              </Button>
              <Button variant="ghost" onClick={() => setEditColumnDateModal({ oldDate: null, newDate: '' })}>
                Cancelar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
} 
