import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Stack,
  useToast,
  Image,
  Box,
} from '@chakra-ui/react';
import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { storage } from '@/config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const ANGLES = [
  { value: 'front', label: 'Front' },
  { value: 'back', label: 'Back' },
  { value: 'left', label: 'Left Side' },
  { value: 'right', label: 'Right Side' },
  { value: 'double-biceps', label: 'Double Biceps' },
];

export default function PhotoUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [angle, setAngle] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const queryClient = useQueryClient();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const mutation = useMutation(
    async (data: { url: string; thumbnailUrl: string; angle: string }) =>
      axios.post(`${process.env.NEXT_PUBLIC_API_URL}/photos`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('photos');
        toast({
          title: 'Success',
          description: 'Photo uploaded successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        resetForm();
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to upload photo',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },
    }
  );

  const resetForm = () => {
    setSelectedFile(null);
    setAngle('');
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !angle) return;

    setLoading(true);
    try {
      // Upload original image
      const originalRef = ref(storage, `photos/${Date.now()}-${selectedFile.name}`);
      await uploadBytes(originalRef, selectedFile);
      const url = await getDownloadURL(originalRef);

      // Create and upload thumbnail
      const thumbnailRef = ref(storage, `photos/thumbnails/${Date.now()}-thumb-${selectedFile.name}`);
      const thumbnailBlob = await createThumbnail(selectedFile);
      await uploadBytes(thumbnailRef, thumbnailBlob);
      const thumbnailUrl = await getDownloadURL(thumbnailRef);

      // Save photo data
      mutation.mutate({ url, thumbnailUrl, angle });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload photo',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const createThumbnail = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate thumbnail dimensions
        const maxSize = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Could not create thumbnail'));
            }
          },
          'image/jpeg',
          0.8
        );
      };
      img.onerror = () => reject(new Error('Could not load image'));
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={4}>
        <FormControl>
          <FormLabel>Photo Angle</FormLabel>
          <Select
            value={angle}
            onChange={(e) => setAngle(e.target.value)}
            placeholder="Select angle"
            required
          >
            {ANGLES.map((angle) => (
              <option key={angle.value} value={angle.value}>
                {angle.label}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Photo</FormLabel>
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            ref={fileInputRef}
            required
          />
        </FormControl>

        {preview && (
          <Box>
            <Image
              src={preview}
              alt="Preview"
              maxH="200px"
              objectFit="contain"
            />
          </Box>
        )}

        <Button
          type="submit"
          colorScheme="brand"
          isLoading={loading || mutation.isLoading}
          loadingText="Uploading..."
          isDisabled={!selectedFile || !angle}
        >
          Upload Photo
        </Button>
      </Stack>
    </form>
  );
} 