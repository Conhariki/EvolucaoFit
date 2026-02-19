import { Box, Container, Skeleton, SkeletonCircle, SkeletonText, SimpleGrid, Stack } from '@chakra-ui/react';

export default function DashboardLoading() {
    return (
        <Container maxW="container.xl" py={10}>
            <Stack spacing={8}>
                <Box>
                    <Skeleton height="40px" width="300px" mb={2} />
                    <Skeleton height="20px" width="200px" />
                </Box>

                {/* Status Cards */}
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                    <Skeleton height="150px" borderRadius="lg" />
                    <Skeleton height="150px" borderRadius="lg" />
                    <Skeleton height="150px" borderRadius="lg" />
                </SimpleGrid>

                {/* Charts/Metrics */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <Skeleton height="200px" borderRadius="lg" />
                    <Skeleton height="200px" borderRadius="lg" />
                </SimpleGrid>

                {/* Graph */}
                <Skeleton height="400px" borderRadius="lg" />
            </Stack>
        </Container>
    );
}
