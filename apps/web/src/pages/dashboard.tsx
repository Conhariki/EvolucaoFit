import {
  Box,
  Container,
  Grid,
  Heading,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import MeasurementForm from '@/components/MeasurementForm';
import PhotoUpload from '@/components/PhotoUpload';
import ProgressChart from '@/components/ProgressChart';
import RecentPhotos from '@/components/RecentPhotos';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const bgColor = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return null;
  }

  return (
    <Container maxW="7xl" py={8}>
      <Stack spacing={8}>
        <Box>
          <Heading size="lg">Welcome, {user?.displayName || 'User'}</Heading>
          <Text color="gray.600">Track your fitness progress</Text>
        </Box>

        <Grid
          templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
          gap={8}
        >
          <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="sm">
            <Heading size="md" mb={4}>Add New Measurement</Heading>
            <MeasurementForm />
          </Box>

          <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="sm">
            <Heading size="md" mb={4}>Upload Progress Photo</Heading>
            <PhotoUpload />
          </Box>
        </Grid>

        <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="sm">
          <Heading size="md" mb={4}>Progress Chart</Heading>
          <ProgressChart />
        </Box>

        <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="sm">
          <Heading size="md" mb={4}>Recent Photos</Heading>
          <RecentPhotos />
        </Box>
      </Stack>
    </Container>
  );
} 