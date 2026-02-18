import {
  Box,
  Grid,
  Image,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { useQuery } from 'react-query';
import axios from 'axios';

interface Photo {
  _id: string;
  date: string;
  angle: string;
  url: string;
  thumbnailUrl: string;
}

const ANGLE_LABELS: { [key: string]: string } = {
  front: 'Front',
  back: 'Back',
  left: 'Left Side',
  right: 'Right Side',
  'double-biceps': 'Double Biceps',
};

export default function RecentPhotos() {
  const bgColor = useColorModeValue('white', 'gray.800');

  const { data: photos, isLoading } = useQuery<Photo[]>(
    'photos',
    async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/photos/my-photos`);
      return response.data;
    }
  );

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!photos || photos.length === 0) {
    return <Text>No photos uploaded yet</Text>;
  }

  // Get the most recent photo for each angle
  const recentPhotos = photos.reduce((acc: Photo[], photo) => {
    const existingPhoto = acc.find((p) => p.angle === photo.angle);
    if (!existingPhoto || new Date(photo.date) > new Date(existingPhoto.date)) {
      return [...acc.filter((p) => p.angle !== photo.angle), photo];
    }
    return acc;
  }, []);

  return (
    <Grid
      templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
      gap={6}
    >
      {recentPhotos.map((photo) => (
        <Box
          key={photo._id}
          bg={bgColor}
          borderRadius="lg"
          overflow="hidden"
          boxShadow="sm"
        >
          <Image
            src={photo.thumbnailUrl}
            alt={`${ANGLE_LABELS[photo.angle]} view`}
            width="100%"
            height="300px"
            objectFit="cover"
          />
          <VStack p={4} align="start" spacing={1}>
            <Text fontWeight="bold">{ANGLE_LABELS[photo.angle]}</Text>
            <Text color="gray.600" fontSize="sm">
              {new Date(photo.date).toLocaleDateString()}
            </Text>
          </VStack>
        </Box>
      ))}
    </Grid>
  );
} 