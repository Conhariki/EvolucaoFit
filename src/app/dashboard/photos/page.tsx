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
  Tooltip,
  Spinner,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverCloseButton,
  Stack,
} from '@chakra-ui/react';
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
import { useBreakpointValue } from '@chakra-ui/react';
import { FiFilter } from 'react-icons/fi';

interface Photo {
  id: string;
  url: string;
  angle: string;
  date: string;
}

const ANGLE_LABELS = {
  FRONT: 'Frente',
  LEFT: 'Lado esquerdo',
  RIGHT: 'Lado direito',
  BACK: 'Costa',
  BICEPS_FRONT: 'Duplo bíceps frente',
  BICEPS_BACK: 'Duplo bíceps costa',
};

const ANGLES = Object.entries(ANGLE_LABELS).map(([value, label]) => ({ value, label }));

function PhotoCell({ photo, angle, date, onUpload, onEdit, onDelete, openCropper, onZoom }: {
  photo: Photo | null;
  angle: string;
  date: string;
  onUpload: (file: File, angle: string) => void;
  onEdit: (photo: Photo) => void;
  onDelete: (id: string) => void;
  openCropper: (file: File | null, angle?: string, date?: string) => void;
  onZoom: (url: string) => void;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    maxFiles: 1,
    noClick: false,
    noKeyboard: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) openCropper(acceptedFiles[0], angle, date);
    },
  });
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
          cursor: 'zoom-in',
        },
        '&:hover .photo-zoomable': {
          transform: 'scale(1.7)',
          zIndex: 10,
        },
      }}
    >
      <input {...getInputProps()} />
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
            onClick={() => onZoom(photo.url)}
            aria-label="Abrir zoom da foto"
          />
          <VStack
            position="absolute"
            left="50%"
            bottom={1}
            transform="translateX(-50%)"
            spacing={1}
            align="center"
            opacity={hovered ? 1 : 0}
            transition="opacity 0.2s"
            zIndex={2}
            bg="rgba(20,20,20,0.5)"
            borderRadius="md"
            px={1}
            py={1}
          >
            <IconButton
              aria-label="Editar foto"
              icon={<EditIcon />}
              size="xs"
              colorScheme="blue"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(photo);
              }}
            />
            <IconButton
              aria-label="Colar foto"
              icon={<AttachmentIcon />}
              size="xs"
              colorScheme="green"
              onClick={(e) => {
                e.stopPropagation();
                openCropper(null, angle, date);
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
          </VStack>
        </Box>
      ) : (
        <Box position="relative" minH="80px" display="flex" alignItems="center" justifyContent="center">
          <IconButton
            aria-label="Inserir foto"
            icon={<AddIcon />}
            size="lg"
            colorScheme="teal"
            borderRadius="full"
            onClick={(e) => {
              e.stopPropagation();
              openCropper(null, angle, date);
            }}
          />
        </Box>
      )}
    </Box>
  );
}

export default function PhotosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [selectedDate, setSelectedDate] = useState('');
  const [uploadingAngle, setUploadingAngle] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fetcher = (url: string) => axios.get(url, { withCredentials: true }).then(res => res.data);
  const { data: photos = [], error, isLoading, mutate } = useSWR('/api/photos', fetcher, { revalidateOnFocus: false });
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
  const theme = useTheme();
  const { data: measurements = [] } = useSWR('/api/measurements', fetcher, { revalidateOnFocus: false });
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [zoomModal, setZoomModal] = useState<{ open: boolean; url: string | null }>({ open: false, url: null });
  const [actionLoading, setActionLoading] = useState(false);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    maxFiles: 10,
    noClick: true,
    noKeyboard: true,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0 && uploadingAngle) {
        acceptedFiles.forEach(file => openCropper(file));
      }
    },
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Função para formatar data para exibição (pt-BR)
  const formatDateDisplay = (dateString: string) => {
    try {
      // Verificar se a string é válida
      if (!dateString) {
        console.error('Data indefinida recebida em formatDateDisplay:', dateString);
        return '';
      }
      
      // Para datas ISO strings (do banco de dados)
      if (dateString.includes('T')) {
        // Usar UTC para evitar problemas de fuso horário
        const parts = dateString.split('T')[0].split('-');
        if (parts.length === 3) {
          const [year, month, day] = parts;
          return `${day}/${month}/${year}`;
        }
      }
      
      // Para datas no formato YYYY-MM-DD
      if (dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          const [year, month, day] = parts;
          return `${day}/${month}/${year}`;
        }
      }
      
      // Para datas que já estão no formato DD/MM/YYYY
      if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          return dateString;
        }
      }
      
      // Tentar criar um objeto Date como última opção
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR');
      }
      
      console.error('Formato de data não reconhecido em formatDateDisplay:', dateString);
      return '';
    } catch (error) {
      console.error('Erro ao formatar data:', error, dateString);
      return '';
    }
  };

  // Agrupa as fotos por data ISO e tipo
  const photosByDateAndAngle: Record<string, Record<string, Photo>> = {};
  (photos as Photo[]).forEach((photo: Photo) => {
    const dateIso = photo.date.split('T')[0]; // yyyy-mm-dd
    if (!photosByDateAndAngle[dateIso]) photosByDateAndAngle[dateIso] = {};
    photosByDateAndAngle[dateIso][photo.angle] = photo;
  });
  // Ordena as datas do mais recente para o mais antigo
  const allDates = Array.from(new Set([...Object.keys(photosByDateAndAngle), ...extraDates]));
  const sortedDates = allDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  // Gerar lista de meses/anos únicos presentes nas datas
  const allMonthYears = Array.from(new Set(sortedDates.map(dateIso => {
    const [year, month] = dateIso.split('-');
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
  const filteredDates = sortedDates.filter(dateIso => {
    const [year, month] = dateIso.split('-');
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
  const compareUrl = `/dashboard/photos/compare?dates=${selectedDates.join(',')}`;

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
    if (!cropImage || !completedCrop || !imageRef || !completedCrop.width || !completedCrop.height || !uploadingAngle || !selectedDate) return;
    // Criar canvas para recortar a imagem
    const canvas = document.createElement('canvas');
    const scaleX = imageRef.naturalWidth / imageRef.width;
    const scaleY = imageRef.naturalHeight / imageRef.height;
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(
      imageRef,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );
    return new Promise<void>((resolve) => {
      canvas.toBlob(async (blob) => {
        if (blob) {
          const croppedFile = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
    setCropModalOpen(false);
    setCropImage(null);
    setZoom(1);
          setCrop({ unit: '%', width: 100, height: 100, x: 0, y: 0 });
          setCompletedCrop(null);
    // Se já existe foto para o ângulo/data, faz update, senão faz upload novo
          const existing = photos.find((p: Photo) => {
            const photoDate = new Date(p.date);
            const uploadDate = new Date(selectedDate);
            return photoDate.toDateString() === uploadDate.toDateString() && p.angle === uploadingAngle;
          });
    if (existing) {
      // Update (PUT)
      const formData = new FormData();
      formData.append('file', croppedFile);
      formData.append('angle', uploadingAngle);
      formData.append('date', selectedDate);
      formData.append('id', existing.id);
      await axios.put('/api/photos', formData);
            mutate();
      toast({ title: 'Foto atualizada', status: 'success', duration: 3000, isClosable: true });
    } else {
      // Novo upload
            if (uploadingAngle) handleUpload(croppedFile, uploadingAngle);
          }
    }
        resolve();
      }, 'image/jpeg');
    });
  };

  // Função para deletar todas as fotos de uma data
  const handleDeleteDate = async (date: string) => {
    if (!date) return;
    
    console.log('Tentando excluir data:', date);
    
    // Verificar se a data está no formato DD/MM/YYYY ou YYYY-MM-DD
    let formattedDate = date;
    if (date.includes('/')) {
      // Converter de DD/MM/YYYY para YYYY-MM-DD
      const [day, month, year] = date.split('/');
      formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    console.log('Data formatada para exclusão:', formattedDate);
    
    // Verificar se existe pelo menos uma foto para a data
    const hasPhoto = (photos as Photo[]).some((p: Photo) => {
      const photoDate = new Date(p.date);
      const dateToCheck = new Date(formattedDate);
      
      console.log('Comparando datas:', {
        photoDate: photoDate.toISOString().split('T')[0],
        dateToCheck: dateToCheck.toISOString().split('T')[0],
        isMatch: photoDate.toISOString().split('T')[0] === dateToCheck.toISOString().split('T')[0]
      });
      
      return photoDate.toISOString().split('T')[0] === dateToCheck.toISOString().split('T')[0];
    });
    
    console.log('Tem fotos nesta data?', hasPhoto);
    
    if (!hasPhoto) {
      // Data extra (sem fotos no backend)
      console.log('Removendo data extra (sem fotos):', formattedDate);
      setExtraDates(prev => prev.filter(d => {
        const normalizedD = d.includes('T') ? d.split('T')[0] : d;
        const normalizedFormattedDate = formattedDate.includes('T') ? formattedDate.split('T')[0] : formattedDate;
        console.log('Comparando:', normalizedD, normalizedFormattedDate);
        return normalizedD !== normalizedFormattedDate;
      }));
      setSelectedDates(prev => prev.filter(d => {
        const normalizedD = d.includes('T') ? d.split('T')[0] : d;
        const normalizedFormattedDate = formattedDate.includes('T') ? formattedDate.split('T')[0] : formattedDate;
        return normalizedD !== normalizedFormattedDate;
      }));
      toast({ title: 'Sucesso', description: 'Data removida', status: 'success', duration: 3000, isClosable: true });
      setDeleteDate(null);
      return;
    }
    
    try {
      console.log('Excluindo fotos da data:', formattedDate);
      
      // Encontrar todas as fotos desta data para excluir uma a uma
      const photosToDelete = (photos as Photo[]).filter(p => {
        const photoDate = new Date(p.date);
        const dateToCheck = new Date(formattedDate);
        return photoDate.toISOString().split('T')[0] === dateToCheck.toISOString().split('T')[0];
      });
      
      console.log(`Encontradas ${photosToDelete.length} fotos para excluir`);
      
      if (photosToDelete.length === 0) {
        toast({ 
          title: 'Aviso', 
          description: 'Não há fotos para excluir nesta data', 
          status: 'warning', 
          duration: 3000, 
          isClosable: true 
        });
        setDeleteDate(null);
        return;
      }
      
      // Excluir foto por foto ao invés de tentar excluir por data
      let successCount = 0;
      for (const photo of photosToDelete) {
        try {
          await axios.delete(`/api/photos?id=${photo.id}`, {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
          });
          successCount++;
        } catch (error) {
          console.error(`Erro ao excluir foto ID ${photo.id}:`, error);
        }
      }
      
      // Recarregar os dados
      await mutate();
      
      setSelectedDates(prev => prev.filter(d => {
        const normalizedD = d.includes('T') ? d.split('T')[0] : d;
        const normalizedFormattedDate = formattedDate.includes('T') ? formattedDate.split('T')[0] : formattedDate;
        return normalizedD !== normalizedFormattedDate;
      }));
      
      toast({ 
        title: 'Sucesso', 
        description: `${successCount} de ${photosToDelete.length} fotos excluídas`, 
        status: 'success', 
        duration: 3000, 
        isClosable: true 
      });
    } catch (error) {
      console.error('Erro ao excluir fotos da data:', error);
      toast({ 
        title: 'Erro', 
        description: 'Não foi possível excluir as fotos da data', 
        status: 'error', 
        duration: 3000, 
        isClosable: true 
      });
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
      // Usar formato fixo para evitar problemas de fuso horário
      const isoDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T12:00:00.000Z`;
      formData.append('date', isoDate);
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
    setActionLoading(true);
    try {
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

      // Se não tiver data selecionada
      if (!selectedDate) {
        toast({
          title: 'Erro',
          description: 'Data não selecionada. Por favor, selecione uma data.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      console.log('Data para upload:', selectedDate);
      
      // Cria um objeto Date a partir da data selecionada (que está no formato YYYY-MM-DD)
      // e ajusta para o fuso horário local (mesmo método usado na tela de medições)
      const selectedDateObj = new Date(selectedDate);
      
      // Esta linha garante que a data será interpretada no fuso horário local
      // Usamos 12:00 para meio-dia para evitar problemas com horário de verão
      const localDate = new Date(
        selectedDateObj.getFullYear(),
        selectedDateObj.getMonth(),
        selectedDateObj.getDate(),
        12, 0, 0
      );
      
      // ISO String será interpretada como UTC pelo servidor
      const isoDate = localDate.toISOString();
      
      console.log('Data ISO para o servidor:', isoDate);
      console.log('Data local formatada:', localDate.toLocaleDateString('pt-BR'));

      const formData = new FormData();
      formData.append('file', file);
      formData.append('angle', angle);
      formData.append('date', isoDate);

      // Se já existe foto para o ângulo/data, faz update, senão faz upload novo
      const existing = (photos as Photo[]).find((p: Photo) => {
        const photoDate = new Date(p.date);
        // Comparar apenas ano, mês e dia (ignorando horas)
        const photoIsSameDate = 
          photoDate.getFullYear() === localDate.getFullYear() &&
          photoDate.getMonth() === localDate.getMonth() &&
          photoDate.getDate() === localDate.getDate();
        
        const match = photoIsSameDate && p.angle === angle;
        
        console.log('Comparando com foto existente:', {
          photo: p.id,
          date: p.date,
          photoDate: photoDate.toLocaleDateString('pt-BR'),
          angle: p.angle,
          match
        });
        
        return match;
      });

      if (existing) {
        // Update (PUT)
        console.log('Atualizando foto existente:', existing.id);
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
        console.log('Criando nova foto');
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
    } finally {
      setActionLoading(false);
    }
  };

  // Função para deletar uma foto
  const handleDelete = async (id: string) => {
    setActionLoading(true);
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
    } finally {
      setActionLoading(false);
    }
  };

  // Função para atualizar a data de todas as fotos de uma coluna
  const handleSaveColumnDate = async () => {
    if (!editColumnDateModal.oldDate || !editColumnDateModal.newDate) return;
    try {
      setActionLoading(true);
      console.log('Alterando data da coluna:', {
        antigaData: editColumnDateModal.oldDate,
        novaData: editColumnDateModal.newDate
      });
      
      // Converter a data antiga de DD/MM/YYYY para YYYY-MM-DD
      let oldDateIso = editColumnDateModal.oldDate;
      if (editColumnDateModal.oldDate.includes('/')) {
        const [day, month, year] = editColumnDateModal.oldDate.split('/');
        oldDateIso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      console.log('Data antiga normalizada:', oldDateIso);
      
      // Encontrar todas as fotos daquela data
      const fotosAntigas = (photos as Photo[]).filter(p => {
        // Normalizar as datas para comparação (apenas ano-mês-dia)
        const photoDateObj = new Date(p.date);
        const photoDateIso = photoDateObj.toISOString().split('T')[0]; // YYYY-MM-DD
        const oldDateToCompare = oldDateIso.split('T')[0]; // Garantir formato YYYY-MM-DD
        
        console.log('Comparando datas:', {
          photoDate: p.date,
          photoDateIso,
          oldDateIso,
          oldDateToCompare,
          isMatch: photoDateIso === oldDateToCompare
        });
        
        return photoDateIso === oldDateToCompare;
      });
      
      console.log('Fotos encontradas para alterar:', fotosAntigas.length);
      
      if (fotosAntigas.length === 0) {
        toast({ 
          title: 'Aviso', 
          description: 'Não foram encontradas fotos para esta data.', 
          status: 'warning', 
          duration: 3000, 
          isClosable: true 
        });
        setActionLoading(false);
        return;
      }
      
      let successCount = 0;
      for (const foto of fotosAntigas) {
        try {
          // Buscar a imagem original
          const response = await fetch(foto.url);
          const blob = await response.blob();
          const file = new File([blob], 'original.jpg', { type: 'image/jpeg' });
          const formData = new FormData();
          formData.append('file', file);
          formData.append('angle', foto.angle);
          
          // Criar data a partir de editColumnDateModal.newDate (formato YYYY-MM-DD)
          const [year, month, day] = editColumnDateModal.newDate.split('-').map(Number);
          
          // Criar um objeto Date no fuso horário local com horário meio-dia
          const newDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
          const isoDate = newDate.toISOString();
          
          console.log(`Atualizando foto ${foto.id} de ${foto.date} para ${isoDate}`);
          
          formData.append('date', isoDate);
          formData.append('id', foto.id);
          
          // Enviar para o servidor
          const result = await axios.put('/api/photos', formData);
          console.log('Resultado da atualização:', result.data);
          successCount++;
        } catch (error) {
          console.error(`Erro ao atualizar foto ID ${foto.id}:`, error);
        }
      }
      
      toast({ 
        title: 'Data da coluna atualizada', 
        description: `${successCount} de ${fotosAntigas.length} fotos atualizadas para ${new Date(editColumnDateModal.newDate+'T12:00:00Z').toLocaleDateString('pt-BR')}`, 
        status: 'success', 
        duration: 3000, 
        isClosable: true 
      });
      
      setEditColumnDateModal({ oldDate: null, newDate: '' });
      mutate(); // Recarregar os dados
    } catch (error) {
      console.error('Erro ao atualizar data da coluna:', error);
      toast({ 
        title: 'Erro ao atualizar data da coluna', 
        description: 'Ocorreu um erro ao atualizar a data das fotos.', 
        status: 'error', 
        duration: 3000, 
        isClosable: true 
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Função para normalizar a data para comparação
  const normalizeDateForComparison = (dateString: string) => {
    try {
      // Verificar se a string de data não é undefined ou null
      if (!dateString) {
        console.error('Data indefinida recebida:', dateString);
        return '';
      }
      
      // Para datas ISO (com 'T')
      if (dateString.includes('T')) {
        return dateString.split('T')[0]; // Retorna YYYY-MM-DD
      }
      
      // Para datas com formato DD/MM/YYYY
      if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
      
      // Para datas já no formato YYYY-MM-DD
      if (dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          return dateString; // Já está no formato correto
        }
      }
      
      // Tentar criar um objeto Date como última opção
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      
      console.error('Formato de data não reconhecido:', dateString);
      return '';
    } catch (error) {
      console.error('Erro ao normalizar data:', error, dateString);
      return '';
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

  function getPesoByDate(dateIso: string) {
    // dateIso no formato yyyy-mm-dd
    const medida = measurements.find((m: any) => {
      const d = new Date(m.date);
      const localDateIso = d.toISOString().split('T')[0];
      return localDateIso === dateIso;
    });
    return medida ? `${medida.weight}kg` : null;
  }

  // Abreviações para mobile
  const ANGLE_LABELS_MOBILE = {
    FRONT: 'Frente',
    LEFT: 'L. Esq.',
    RIGHT: 'L. Dir.',
    BACK: 'Costa',
    BICEPS_FRONT: 'Bic. F.',
    BICEPS_BACK: 'Bic. C.',
  };

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
      <VStack spacing={2} align="stretch">
        <Flex align="center" gap={4}>
          <FormControl maxW="200px" mb={0}>
            <FormLabel>Data</FormLabel>
            <Input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              title="Selecione uma data no formato YYYY-MM-DD"
              placeholder="YYYY-MM-DD"
            />
            <Text fontSize="xs" color="gray.500" mt={1}>
              Formato esperado: AAAA-MM-DD
            </Text>
          </FormControl>
          <Button
            colorScheme="teal"
            ml={2}
            alignSelf="flex-end"
            onClick={() => {
              // Validar se uma data foi selecionada
              if (!selectedDate) {
                toast({
                  title: 'Erro',
                  description: 'Por favor, selecione uma data primeiro.',
                  status: 'error',
                  duration: 3000,
                  isClosable: true,
                });
                return;
              }
              
              console.log('Data selecionada original:', selectedDate);
              
              // Criar data a partir da string no formato YYYY-MM-DD, mas com UTC+0
              // Para evitar problemas de fuso horário, vamos criar a data diretamente
              const [year, month, day] = selectedDate.split('-').map(Number);
              
              // Criar um objeto Date com o dia correto (sem perder um dia)
              // Usando o construtor Date(year, month-1, day) com mês 0-based
              const dateObj = new Date(Date.UTC(year, month - 1, day));
              
              console.log('Data UTC criada:', dateObj.toISOString());
              console.log('Data local:', dateObj.toLocaleDateString('pt-BR'));
              
              // Garantir que seja meio-dia para evitar problemas de fuso
              dateObj.setUTCHours(12, 0, 0, 0);
              
              // Formatar como YYYY-MM-DD para armazenamento interno
              const formatted = dateObj.toISOString().split('T')[0];
              
              console.log('Data formatada para armazenamento:', formatted);
              console.log('Data para exibição:', new Date(formatted).toLocaleDateString('pt-BR'));
              
              if (!sortedDates.includes(formatted) && !extraDates.includes(formatted)) {
                setExtraDates(prev => [...prev, formatted]);
                toast({
                  title: 'Sucesso',
                  description: `Data adicionada: ${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`,
                  status: 'success',
                  duration: 3000,
                  isClosable: true,
                });
              } else {
                toast({
                  title: 'Aviso',
                  description: 'Esta data já existe na lista.',
                  status: 'warning',
                  duration: 3000,
                  isClosable: true,
                });
              }
              setSelectedDate('');
            }}
            isDisabled={!selectedDate}
          >
            Adicionar Data
          </Button>
        </Flex>
        {/* Filtro e botões de ação */}
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'stretch', md: 'center' }}
          justify="space-between"
          mb={2}
          gap={{ base: 2, md: 0 }}
        >
          <Box maxW="420px" w="100%">
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
                <Popover placement="bottom-start">
                  <PopoverTrigger>
                    <Button leftIcon={<FiFilter />} size={isMobile ? 'sm' : 'md'} variant="outline" colorScheme="teal" px={3}>
                      <Badge colorScheme="teal" ml={2} fontSize="0.8em">{selectedMonthYears.length}</Badge>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent minW="220px">
                    <PopoverHeader fontWeight="bold">Filtrar por mês/ano</PopoverHeader>
                    <PopoverCloseButton />
                    <PopoverBody>
                      <Flex gap={2} mb={2}>
                        <Button size="xs" colorScheme="teal" variant="ghost" onClick={() => setSelectedMonthYears(allMonthYears)}>
                          Selecionar Todos
                        </Button>
                        <Button size="xs" colorScheme="gray" variant="ghost" onClick={() => setSelectedMonthYears([])}>
                          Limpar Seleção
                        </Button>
                      </Flex>
                      <Stack spacing={1}>
                        {monthYearOptions.map(opt => (
                          <Checkbox
                            key={opt.value}
                            isChecked={selectedMonthYears.includes(opt.value)}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedMonthYears(prev => [...prev, opt.value]);
                              } else {
                                setSelectedMonthYears(prev => prev.filter(v => v !== opt.value));
                              }
                            }}
                          >
                            {opt.label}
                          </Checkbox>
                        ))}
                      </Stack>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
              </Box>
            </FormControl>
          </Box>
          <Flex gap={{ base: 1, md: 2 }} mt={{ base: 2, md: 0 }}>
            <Button
              colorScheme="teal"
              variant="outline"
              size={isMobile ? 'sm' : 'md'}
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
              size={isMobile ? 'sm' : 'md'}
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
          </Flex>
        </Flex>
        {/* Visualização de todas as datas/fotos */}
        <Box mt={0} position="relative" px={0}>
          <Box overflowX="auto" py={0} px={0}>
            <Grid id="photo-comparison-grid"
              templateColumns={{ base: `min-content repeat(${filteredDates.length}, 140px)`, md: `min-content repeat(${filteredDates.length}, 1fr)` }}
              gap={2}
              minW={{ base: `${filteredDates.length * 140 + 40}px`, md: '900px' }}
              alignItems="center"
              ml={0}
            >
              {/* Cabeçalho: célula vazia + datas */}
              <Box
                sx={{
                  position: { base: 'static', md: 'sticky' },
                  top: { base: 'auto', md: 0 },
                  zIndex: 2,
                  background: useColorModeValue('gray.50', 'gray.900'),
                  borderTopLeftRadius: { base: 0, md: isMobile ? 'xl' : 'lg' },
                  borderTopRightRadius: { base: 0, md: isMobile ? 'xl' : 'lg' },
                }}
              />
              {filteredDates.map(date => (
                <Box
                  key={date}
                  sx={{
                    position: { base: 'static', md: 'sticky' },
                    top: { base: 'auto', md: 0 },
                    zIndex: 2,
                    background: useColorModeValue('white', 'gray.800'),
                    borderTopLeftRadius: { base: 0, md: isMobile ? 'xl' : 'lg' },
                    borderTopRightRadius: { base: 0, md: isMobile ? 'xl' : 'lg' },
                    boxShadow: { base: 'none', md: isMobile ? 'lg' : 'md' },
                    borderWidth: { base: 0, md: 1 },
                  }}
                  borderRadius={isMobile ? 'xl' : 'lg'}
                  px={{ base: 0.5, md: 2 }}
                  py={{ base: 0.5, md: 1 }}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  gap={1}
                  minH={{ base: '32px', md: '40px' }}
                  position="relative"
                >
                  <Flex align="center" gap={1} mb={0}>
                    <Checkbox
                      isChecked={selectedDates.includes(date)}
                      onChange={() => handleDateCheck(date)}
                      size={isMobile ? 'sm' : 'md'}
                    >
                      <Box textAlign="left" lineHeight={1.1}>
                        <Text fontWeight="bold" fontSize={{ base: 'xs', md: 'sm' }}>{formatDateDisplay(date)}</Text>
                        {getPesoByDate(date) && (
                          <Text fontSize="xs" color="gray.400">{getPesoByDate(date)}</Text>
                        )}
                      </Box>
                    </Checkbox>
                    <Tooltip label="Editar data da coluna">
                      <IconButton
                        aria-label="Editar data da coluna"
                        icon={<CalendarIcon />}
                        size="xs"
                        colorScheme="yellow"
                        variant="ghost"
                        isRound
                        onClick={() => {
                          console.log('Clicou para editar a data:', date);
                          
                          // Converter data para formato que o input date aceita (YYYY-MM-DD)
                          let formattedDate = date;
                          if (date.includes('/')) {
                            // Converter de DD/MM/YYYY para YYYY-MM-DD
                            const [day, month, year] = date.split('/');
                            formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                          }
                          
                          console.log('Data formatada para edição:', formattedDate);
                          
                          // Definir a data antiga (para referência) e a nova (inicialmente igual à antiga)
                          setEditColumnDateModal({ 
                            oldDate: date, 
                            newDate: formattedDate 
                          });
                        }}
                      />
                    </Tooltip>
                    <Tooltip label="Excluir data">
                      <IconButton
                        aria-label="Excluir data"
                        icon={<DeleteIcon />}
                        size="xs"
                        colorScheme="red"
                        variant="ghost"
                        isRound
                        onClick={() => setDeleteDate(date)}
                      />
                    </Tooltip>
                  </Flex>
                </Box>
              ))}
              {/* Linhas: cada ângulo é uma linha, primeira coluna é o label, depois as fotos */}
              {ANGLES.map(({ value, label }) => {
                const mobileLabel = ANGLE_LABELS_MOBILE[value as keyof typeof ANGLE_LABELS_MOBILE];
                return [
                  <Box
                    key={label}
                    minW="1px"
                    width="auto"
                    pr={0}
                    pl={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="flex-start"
                    whiteSpace="nowrap"
                  >
                    {isMobile ? (
                      <Tooltip label={label}>
                        <Text fontSize="xs" color="gray.400" textAlign="left">{mobileLabel}</Text>
                      </Tooltip>
                    ) : (
                      <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.400" textAlign="left">{label}</Text>
                    )}
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
                        onZoom={url => setZoomModal({ open: true, url })}
                      />
                    </Box>
                  ))
                ];
              })}
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
                  onClick={async () => {
                    try {
                      let croppedFile: File;
                      if (completedCrop && imageRef && completedCrop.width && completedCrop.height) {
                        // Se houver recorte selecionado, aplicar o recorte
                        const canvas = document.createElement('canvas');
                        const scaleX = imageRef.naturalWidth / imageRef.width;
                        const scaleY = imageRef.naturalHeight / imageRef.height;
                        canvas.width = completedCrop.width * scaleX;
                        canvas.height = completedCrop.height * scaleY;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) throw new Error('Não foi possível criar o contexto do canvas');
                        ctx.drawImage(
                          imageRef,
                          completedCrop.x * scaleX,
                          completedCrop.y * scaleY,
                          completedCrop.width * scaleX,
                          completedCrop.height * scaleY,
                          0,
                          0,
                          completedCrop.width * scaleX,
                          completedCrop.height * scaleY
                        );
                        const blob = await new Promise<Blob>((resolve) => {
                          canvas.toBlob((blob) => {
                            if (blob) resolve(blob);
                            else throw new Error('Falha ao criar blob da imagem');
                          }, 'image/jpeg', 0.95);
                        });
                        croppedFile = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
                      } else {
                        // Se não houver recorte, usar a imagem original
                        const response = await fetch(cropImage);
                        const blob = await response.blob();
                        croppedFile = new File([blob], 'original.jpg', { type: 'image/jpeg' });
                      }
                      // Fechar modal e limpar estados
                      setCropModalOpen(false);
                      setCropImage(null);
                      setCrop({ unit: '%', width: 100, height: 100, x: 0, y: 0 });
                      setCompletedCrop(null);
                      // Sempre faz upload ao salvar
                      if (uploadingAngle) handleUpload(croppedFile, uploadingAngle);
                    } catch (error) {
                      console.error('Erro ao processar imagem:', error);
                      toast({
                        title: 'Erro',
                        description: 'Não foi possível processar a imagem',
                        status: 'error',
                        duration: 3000,
                        isClosable: true,
                      });
                    }
                  }}
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
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold" mb={1}>Data Atual:</Text>
                  <Text>{editColumnDateModal.oldDate}</Text>
                </Box>
                <Divider />
                <FormControl>
                  <FormLabel>Nova Data</FormLabel>
                  <Input
                    type="date"
                    value={editColumnDateModal.newDate}
                    onChange={e => setEditColumnDateModal(prev => ({ ...prev, newDate: e.target.value }))}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Formato esperado: AAAA-MM-DD
                  </Text>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button 
                colorScheme="blue" 
                mr={3} 
                onClick={handleSaveColumnDate}
                isDisabled={!editColumnDateModal.newDate || editColumnDateModal.newDate === ''}
                isLoading={actionLoading}
              >
                Salvar
              </Button>
              <Button variant="ghost" onClick={() => setEditColumnDateModal({ oldDate: null, newDate: '' })}>
                Cancelar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {/* Spinner global para ações de upload/delete */}
        {actionLoading && (
          <Flex position="fixed" top={0} left={0} w="100vw" h="100vh" align="center" justify="center" zIndex={2000} bg="rgba(0,0,0,0.2)">
            <Spinner size="xl" color="teal.400" thickness="4px" />
          </Flex>
        )}
        {/* Modal de zoom da foto */}
        <Modal isOpen={zoomModal.open} onClose={() => setZoomModal({ open: false, url: null })} size="2xl" isCentered>
          <ModalOverlay />
          <ModalContent bg={useColorModeValue('white', 'gray.900')}>
            <ModalCloseButton />
            <ModalBody display="flex" alignItems="center" justifyContent="center" p={4}>
              {zoomModal.url && (
                <Image src={zoomModal.url} alt="Zoom da foto" maxH="70vh" maxW="100%" borderRadius="lg" />
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
} 
